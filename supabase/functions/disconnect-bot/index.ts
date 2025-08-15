import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`📥 Received disconnection request`)
    const { email } = await req.json()
    console.log(`📧 Disconnecting bot for email: ${email}`)

    console.log(`📊 Updating database - marking ${email} as disconnected`)
    await supabase
      .from('accounts')
      .update({ 
        connection_status: 'disconnected',
        is_connected: false 
      })
      .eq('email', email)

    console.log(`📝 Logging disconnection request to database`)
    await supabase.from('bot_logs').insert({
      account_email: email,
      log_level: 'INFO',
      message: 'Bot disconnection requested'
    })

    console.log(`✅ Disconnection processed successfully for ${email}`)
    return new Response(
      JSON.stringify({ message: `Disconnection initiated for ${email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Disconnect function error:', error.message)
    console.error('🔍 Full error details:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})