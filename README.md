# InteraktifMenu SaaS Platform - Setup Guide

This guide will help you set up and deploy your InteraktifMenu SaaS platform.

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Netlify account (for deployment)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be fully provisioned

### 2.2 Run Database Migration

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and execute the SQL

### 2.3 Create Storage Buckets

In Supabase Dashboard → Storage:

1. Create bucket: `product-images` (Public bucket)
2. Create bucket: `pdf-menus` (Public bucket, max file size 30MB)

For each bucket, add the following policies:

**Upload Policy:**
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Read Policy:**
```sql
CREATE POLICY "Allow public to read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

(Repeat for `pdf-menus` bucket)

### 2.4 Get Supabase Credentials

From your Supabase project settings → API:
- Copy the Project URL
- Copy the `anon` public key

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 4: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 5: Test the Application

1. **Register a new account** with one of the three plans
2. **Digital Menu (Tam/Yarım Paket):**
   - Add products with images
   - Set Happy Hour pricing
   - View public menu at `/menu/[your-user-id]`
3. **POS System (Tam Paket only):**
   - Create zones and tables
   - Create new orders with snapshot pricing
4. **PDF Menu (All tiers):**
   - Upload a PDF menu (max 30MB)
   - Access it via the public link

## Step 6: Deploy to Netlify

### 6.1 Connect Your Repository

1. Push your code to GitHub/GitLab
2. Log in to Netlify
3. Click "Add new site" → "Import an existing project"
4. Connect to your repository

### 6.2 Configure Build Settings

Netlify should auto-detect Next.js. Verify:
- Build command: `npm run build`
- Publish directory: `.next`

### 6.3 Add Environment Variables

In Netlify Dashboard → Site settings → Environment variables:

Add the same variables from `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 6.4 Deploy

Click "Deploy site" and wait for the build to complete.

## Features Implemented

✅ **Tier-Based Access Control**
- Tam Paket: All features
- Yarım Paket: Digital Menu only
- Giriş Paket: PDF Menu only

✅ **Digital Menu with Happy Hour**
- CRUD for products
- Happy Hour pricing with time-based switching
- Public menu view
- Image upload to Supabase Storage

✅ **POS System (Tam Paket)**
- Zone and table management
- Order creation with **snapshot pricing**
- Table status tracking

✅ **PDF Menu**
- Upload PDFs up to 30MB
- Public PDF viewer
- QR code compatible links

✅ **Authentication**
- Supabase Auth with email/password
- Protected routes with middleware
- Plan selection during registration

## Critical Implementation Notes

### Snapshot Pricing (POS)
When creating an order, the system captures the **current price** at that exact moment (including Happy Hour adjustments) and stores it in `order_items.price_snapshot`. This ensures historical orders maintain their original pricing even if product prices change later.

### Happy Hour Logic
The system checks the current time against the user's configured Happy Hour window (`happy_hour_start` and `happy_hour_end`). During Happy Hour, the `happy_hour_price` is displayed and used for order calculations.

### Row Level Security (RLS)
All database tables use RLS policies to ensure strict tenant isolation. Users can only access their own data.

## Troubleshooting

**Issue:** Images/PDFs not uploading
- Verify storage buckets are created and public
- Check storage policies allow authenticated uploads
- Ensure file size limits are met (5MB for images, 30MB for PDFs)

**Issue:** Authentication errors
- Verify `.env.local` has correct Supabase credentials
- Check Supabase project is active
- Confirm email confirmations are disabled (for development) in Supabase Auth settings

**Issue:** Can't access certain features
- Verify user's plan in the `profiles` table
- Check middleware is protecting routes correctly
- Ensure RLS policies are applied

## Next Steps

- Add Happy Hour time editor in Settings
- Implement order viewing and closing functionality
- Add real-time updates using Supabase Realtime
- Generate QR codes for menu/PDF links
- Add analytics dashboard
- Implement payment integration for subscriptions

## Support

For issues or questions, refer to the implementation plan in the artifacts directory.
