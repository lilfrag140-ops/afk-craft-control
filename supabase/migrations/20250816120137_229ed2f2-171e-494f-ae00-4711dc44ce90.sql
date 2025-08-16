-- Create server_configs table
CREATE TABLE public.server_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_ip TEXT NOT NULL DEFAULT 'localhost',
  server_port INTEGER NOT NULL DEFAULT 25565,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.server_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for server configs (allowing all operations for now since this is a single-user bot application)
CREATE POLICY "Allow all operations on server_configs" 
ON public.server_configs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_server_configs_updated_at
BEFORE UPDATE ON public.server_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();