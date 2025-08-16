import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export class Database {
  static async getAccounts() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async addAccount(email, password) {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        email,
        password,
        connection_status: 'disconnected',
        is_connected: false,
        is_selected: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateAccountStatus(email, status, isConnected = false) {
    const updateData = {
      connection_status: status,
      is_connected: isConnected
    };

    if (isConnected) {
      updateData.last_connected_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('email', email);
    
    if (error) throw error;
  }

  static async logEvent(email, level, message) {
    const { error } = await supabase
      .from('bot_logs')
      .insert({
        account_email: email,
        log_level: level,
        message
      });
    
    if (error) console.error('Failed to log event:', error);
  }

  static async getServerConfig() {
    const { data, error } = await supabase
      .from('server_configs')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.warn('No server config found, using defaults');
    }
    
    return data || {
      server_ip: process.env.DEFAULT_SERVER_IP || 'localhost',
      server_port: parseInt(process.env.DEFAULT_SERVER_PORT) || 25565
    };
  }

  static async updateServerConfig(serverIp, serverPort) {
    // First check if a config exists
    const { data: existing } = await supabase
      .from('server_configs')
      .select('*')
      .limit(1)
      .single();

    if (existing) {
      // Update existing config
      const { error } = await supabase
        .from('server_configs')
        .update({
          server_ip: serverIp,
          server_port: parseInt(serverPort)
        })
        .eq('id', existing.id);
      
      if (error) throw error;
    } else {
      // Insert new config
      const { error } = await supabase
        .from('server_configs')
        .insert({
          server_ip: serverIp,
          server_port: parseInt(serverPort)
        });
      
      if (error) throw error;
    }
  }
}