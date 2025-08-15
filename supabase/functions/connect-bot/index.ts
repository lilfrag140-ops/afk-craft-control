import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Dynamic import for mineflayer
async function createMinecraftBot(email: string, password: string, serverIp: string, serverPort: number) {
  console.log(`🔄 [${email}] Loading mineflayer module...`)
  const mineflayer = await import('https://esm.sh/mineflayer@4.19.1')
  console.log(`✅ [${email}] Mineflayer module loaded successfully`)
  
  console.log(`🚀 [${email}] Creating bot instance for ${serverIp}:${serverPort}`)
  console.log(`📧 [${email}] Using Microsoft authentication`)
  
  const bot = mineflayer.createBot({
    host: serverIp,
    port: serverPort,
    username: email,
    password: password,
    auth: 'microsoft'
  })

  console.log(`⏳ [${email}] Bot instance created, waiting for connection...`)

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log(`⏰ [${email}] Connection timeout after 30 seconds`)
      bot.end()
      reject(new Error('Connection timeout after 30 seconds'))
    }, 30000)

    bot.once('login', () => {
      console.log(`🔐 [${email}] Successfully logged in to server`)
    })

    bot.once('spawn', () => {
      clearTimeout(timeout)
      console.log(`🎮 [${email}] Successfully spawned in server world`)
      console.log(`📍 [${email}] Bot position: x=${bot.entity?.position?.x}, y=${bot.entity?.position?.y}, z=${bot.entity?.position?.z}`)
      console.log(`❤️ [${email}] Bot health: ${bot.health}`)
      resolve(bot)
    })

    bot.on('kicked', (reason) => {
      clearTimeout(timeout)
      console.log(`👢 [${email}] Bot was kicked from server`)
      console.log(`📝 [${email}] Kick reason: ${JSON.stringify(reason)}`)
      reject(new Error(`Kicked: ${JSON.stringify(reason)}`))
    })

    bot.on('error', (err) => {
      clearTimeout(timeout)
      console.log(`💥 [${email}] Bot connection error occurred`)
      console.log(`🔍 [${email}] Error details: ${err.message}`)
      console.log(`📊 [${email}] Error stack: ${err.stack}`)
      reject(err)
    })

    bot.on('end', (reason) => {
      console.log(`🔚 [${email}] Bot connection ended`)
      console.log(`📝 [${email}] End reason: ${reason}`)
    })
  })
}

async function runAfkSequence(bot: any, email: string) {
  try {
    console.log(`⏱️ [${email}] Waiting 3 seconds for server to stabilize...`)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log(`💤 [${email}] Starting AFK sequence...`)
    console.log(`📤 [${email}] Sending AFK command: /afk 33`)
    bot.chat('/afk 33')
    console.log(`✅ [${email}] AFK command sent successfully`)
    
    console.log(`🦘 [${email}] Setting up anti-kick jump mechanism (every 60 seconds)`)
    const jumpInterval = setInterval(() => {
      if (bot.entity) {
        console.log(`🦘 [${email}] Performing anti-kick jump`)
        bot.setControlState('jump', true)
        setTimeout(() => {
          bot.setControlState('jump', false)
          console.log(`✅ [${email}] Jump completed`)
        }, 100)
      } else {
        console.log(`⚠️ [${email}] Bot entity not found, skipping jump`)
      }
    }, 60000)
    
    console.log(`🎯 [${email}] AFK sequence setup completed successfully`)
    return jumpInterval
  } catch (err) {
    console.error(`💥 [${email}] AFK sequence failed with error:`, err)
    console.error(`🔍 [${email}] Error details: ${err.message}`)
    throw err
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`📥 Received connection request`)
    const { email, serverIp, serverPort } = await req.json()
    console.log(`📧 Email: ${email}`)
    console.log(`🌐 Server: ${serverIp}:${serverPort}`)

    console.log(`🔍 Looking up account details for ${email}...`)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', email)
      .single()

    if (accountError || !account) {
      console.log(`❌ Account not found for ${email}`)
      console.log(`🔍 Error details:`, accountError)
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Account found for ${email}`)
    console.log(`🔑 Account has password: ${account.password ? 'Yes' : 'No'}`)

    console.log(`📝 Logging connection attempt to database...`)
    await supabase.from('bot_logs').insert({
      account_email: email,
      log_level: 'INFO',
      message: `Attempting connection to ${serverIp}:${serverPort}`
    })

    console.log(`🔄 Updating account status to 'connecting'...`)
    await supabase
      .from('accounts')
      .update({ 
        connection_status: 'connecting',
        is_connected: false 
      })
      .eq('email', email)
    console.log(`✅ Account status updated successfully`)

    // Background task to handle bot connection
    const backgroundTask = async () => {
      try {
        console.log(`🚀 Starting background connection task for ${email}`)
        const bot = await createMinecraftBot(email, account.password, serverIp, serverPort)
        
        console.log(`📊 Updating database - marking ${email} as connected`)
        await supabase
          .from('accounts')
          .update({ 
            connection_status: 'connected',
            is_connected: true,
            last_connected_at: new Date().toISOString()
          })
          .eq('email', email)

        console.log(`📝 Logging successful connection to database`)
        await supabase.from('bot_logs').insert({
          account_email: email,
          log_level: 'SUCCESS',
          message: 'Successfully connected to server'
        })

        console.log(`🤖 Starting AFK sequence for ${email}`)
        await runAfkSequence(bot, email)

        console.log(`👂 Setting up event handlers for ${email}`)
        bot.on('end', async () => {
          console.log(`🔚 Bot ended event triggered for ${email}`)
          await supabase
            .from('accounts')
            .update({ 
              connection_status: 'disconnected',
              is_connected: false 
            })
            .eq('email', email)

          await supabase.from('bot_logs').insert({
            account_email: email,
            log_level: 'INFO',
            message: 'Bot disconnected'
          })
          console.log(`📊 Database updated - ${email} marked as disconnected`)
        })

        bot.on('chat', (username, message) => {
          console.log(`💬 [${email}] Chat: <${username}> ${message}`)
        })

        bot.on('health', () => {
          console.log(`❤️ [${email}] Health: ${bot.health}/${bot.food}`)
        })

        console.log(`✅ All setup completed successfully for ${email}`)

      } catch (error) {
        console.error(`💥 Connection failed for ${email}:`, error.message)
        console.error(`🔍 Full error details:`, error)
        
        console.log(`📊 Updating database - marking ${email} as failed`)
        await supabase
          .from('accounts')
          .update({ 
            connection_status: 'failed',
            is_connected: false 
          })
          .eq('email', email)

        await supabase.from('bot_logs').insert({
          account_email: email,
          log_level: 'ERROR',
          message: `Connection failed: ${error.message}`
        })
        console.log(`📝 Error logged to database for ${email}`)
      }
    }

    console.log(`🔄 Starting background task for ${email}`)
    EdgeRuntime.waitUntil(backgroundTask())

    console.log(`✅ Connection request processed successfully for ${email}`)
    return new Response(
      JSON.stringify({ message: `Connection initiated for ${email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Edge function error:', error.message)
    console.error('🔍 Full error details:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})