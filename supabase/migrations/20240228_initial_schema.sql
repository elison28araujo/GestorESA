-- Create Servers table (formerly channels)
CREATE TABLE IF NOT EXISTS servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  login TEXT NOT NULL,
  password TEXT NOT NULL,
  max_clients_per_user INTEGER DEFAULT 3,
  status TEXT DEFAULT 'Online',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  expiry DATE NOT NULL,
  image TEXT,
  server_id UUID REFERENCES servers(id),
  login TEXT,
  password TEXT,
  server_accesses JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow public read access on servers" ON servers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on servers" ON servers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on servers" ON servers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on servers" ON servers FOR DELETE USING (true);

CREATE POLICY "Allow public read access on customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on customers" ON customers FOR DELETE USING (true);

CREATE POLICY "Allow public read access on transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on transactions" ON transactions FOR DELETE USING (true);
