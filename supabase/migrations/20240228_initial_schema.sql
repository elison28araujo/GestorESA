-- Create Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  expiry DATE NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  bitrate TEXT NOT NULL,
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

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In a real app, you would restrict this to authenticated users
CREATE POLICY "Allow public read access on customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on customers" ON customers FOR DELETE USING (true);

CREATE POLICY "Allow public read access on channels" ON channels FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on channels" ON channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on channels" ON channels FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on channels" ON channels FOR DELETE USING (true);

CREATE POLICY "Allow public read access on transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on transactions" ON transactions FOR DELETE USING (true);
