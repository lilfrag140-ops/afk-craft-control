import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Dynamic import for mineflayer
async function createMinecraftBot(email: string, password: string, serverIp: string, serverPort: number) {
  const mineflayer = await import('https://esm.sh/mineflayer@4.19.1')
  
  console.log(`[${email}] Attempting to log in to ${serverIp}:${serverPort}...`)
  
  const bot = mineflayer.createBot({
    host: serverIp,
    port: serverPort,
    username: email,
    password: password,
    auth: 'microsoft'
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      bot.end()
      reject(new Error('Connection timeout'))
    }, 30000)

    bot.once('spawn', () => {
      clearTimeout(timeout)
      console.log(`✅ [${email}] Successfully spawned in server`)
      resolve(bot)
    })

    bot.on('kicked', (reason) => {
      clearTimeout(timeout)
      console.log(`❌ [${email}] was kicked. Reason:`, reason)
      reject(new Error(`Kicked: ${reason}`))
    })

    bot.on('error', (err) => {
      clearTimeout(timeout)
      console.log(`⚠️ [${email}] Error:`, err)
      reject(err)
    })
  })
}

async function runAfkSequence(bot: any, email: string) {
  try {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log(`[${email}] Starting AFK sequence...`)
    bot.chat('/afk 33')
    console.log(`✅ [${email}] Successfully sent AFK command`)
    
    // Start anti-kick jumps
    const jumpInterval = setInterval(() => {
      if (bot.entity) {
        bot.setControlState('jump', true)
        setTimeout(() => bot.setControlState('jump', false), 100)
      }
    }, 60000)
    
    return jumpInterval
  } catch (err) {
    console.error(`❌ [${email}] AFK sequence failed:`, err)
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

    const { email, serverIp, serverPort } = await req.json()

    // Get account details from database
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', email)
      .single()

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log connection attempt
    await supabase.from('bot_logs').insert({
      account_email: email,
      log_level: 'INFO',
      message: `Attempting connection to ${serverIp}:${serverPort}`
    })

    // Update account status to connecting
    await supabase
      .from('accounts')
      .update({ 
        connection_status: 'connecting',
        is_connected: false 
      })
      .eq('email', email)

    // Background task to handle bot connection
    const backgroundTask = async () => {
      try {
        const bot = await createMinecraftBot(account.password, account.password, serverIp, serverPort)
        
        // Update status to connected
        await supabase
          .from('accounts')
          .update({ 
            connection_status: 'connected',
            is_connected: true,
            last_connected_at: new Date().toISOString()
          })
          .eq('email', email)

        await supabase.from('bot_logs').insert({
          account_email: email,
          log_level: 'SUCCESS',
          message: 'Successfully connected to server'
        })

        // Start AFK sequence
        await runAfkSequence(bot, email)

        // Handle bot events
        bot.on('end', async () => {
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
        })

      } catch (error) {
        console.error(`Connection failed for ${email}:`, error)
        
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
      }
    }

    // Start background task
    EdgeRuntime.waitUntil(backgroundTask())

    return new Response(
      JSON.stringify({ message: `Connection initiated for ${email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})