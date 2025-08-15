import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log(`🌟 =============== NEW REQUEST ===============`)
  console.log(`📅 Request timestamp: ${new Date().toISOString()}`)
  console.log(`🔧 Request method: ${req.method}`)
  console.log(`📍 Request URL: ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ Handling CORS preflight request`)
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log(`🔧 Creating Supabase client...`)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    console.log(`🔍 SUPABASE_URL exists: ${!!supabaseUrl}`)
    console.log(`🔍 SUPABASE_SERVICE_ROLE_KEY exists: ${!!supabaseKey}`)
    
    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseKey ?? ''
    )
    console.log(`✅ Supabase client created successfully`)

    console.log(`📥 Parsing request body...`)
    let requestBody;
    try {
      requestBody = await req.json()
      console.log(`✅ Request body parsed successfully`)
    } catch (parseError) {
      console.error(`💥 Failed to parse request body:`, parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📥 Received connection request`)
    const { email, password, serverIp, serverPort } = requestBody
    console.log(`📧 Email: ${email}`)
    console.log(`🌐 Server: ${serverIp}:${serverPort}`)
    console.log(`🔑 Password provided: ${password ? 'Yes' : 'No'}`)
    console.log(`🔍 Request body keys: ${Object.keys(requestBody).join(', ')}`)

    // Validate required parameters
    if (!email) {
      console.error(`❌ Missing required parameter: email`)
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!serverIp) {
      console.error(`❌ Missing required parameter: serverIp`)
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: serverIp' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!serverPort) {
      console.error(`❌ Missing required parameter: serverPort`)
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: serverPort' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔍 Looking up account details for ${email}...`)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (accountError) {
      console.log(`❌ Database error looking up account for ${email}:`, accountError)
      return new Response(
        JSON.stringify({ error: `Database error: ${accountError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!account) {
      console.log(`❌ Account not found for ${email} - account needs to be added first`)
      return new Response(
        JSON.stringify({ error: 'Account not found. Please add the account first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Account found for ${email}`)
    console.log(`🔑 Account has password: ${account.password ? 'Yes' : 'No'}`)

    console.log(`📝 Logging connection attempt to database...`)
    await supabase.from('bot_logs').insert({
      account_email: email,
      log_level: 'INFO',
      message: `Connection requested for ${serverIp}:${serverPort}`
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

    // Simulate bot connection process (since we can't run mineflayer in edge function)
    const backgroundTask = async () => {
      try {
        console.log(`🚀 Simulating bot connection for ${email}`)
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // For demo purposes, let's simulate a successful connection
        // In a real implementation, this would trigger an external bot service
        console.log(`✅ Bot connection simulated successfully for ${email}`)
        
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
          message: `Bot simulation completed successfully for ${serverIp}:${serverPort}`
        })

        console.log(`✅ All setup completed successfully for ${email}`)

      } catch (error) {
        console.error(`💥 Connection simulation failed for ${email}:`, error.message)
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
          message: `Connection simulation failed: ${error.message}`
        })
        console.log(`📝 Error logged to database for ${email}`)
      }
    }

    console.log(`🔄 Starting background task for ${email}`)
    EdgeRuntime.waitUntil(backgroundTask())

    console.log(`✅ Connection request processed successfully for ${email}`)
    return new Response(
      JSON.stringify({ 
        message: `Connection simulation initiated for ${email}`,
        note: 'This is a demo version. In production, this would trigger an external Minecraft bot service.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('🚨 =============== EDGE FUNCTION ERROR ===============')
    console.error('💥 Edge function error:', error.message)
    console.error('🔍 Error type:', typeof error)
    console.error('🔍 Error constructor:', error.constructor.name)
    console.error('🔍 Error stack:', error.stack)
    console.error('🔍 Full error object:', error)
    console.error('🔍 Error JSON:', JSON.stringify(error, null, 2))
    console.error('📅 Error timestamp:', new Date().toISOString())
    console.error('🚨 =============== END ERROR LOG ===============')
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        type: error.constructor.name,
        timestamp: new Date().toISOString(),
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})