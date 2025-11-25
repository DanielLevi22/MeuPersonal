# Admin User Creation Scripts

This directory contains scripts for managing admin users.

## Create First Admin

### Prerequisites

1. Install `tsx` for running TypeScript:
```bash
pnpm add -D tsx
```

2. Set environment variables (or edit the script directly):
```bash
export SUPABASE_URL="your-project-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

You can find these in your Supabase project settings:
- **URL**: Project Settings → API → Project URL
- **Service Role Key**: Project Settings → API → service_role (⚠️ Keep this secret!)

### Run the Script

```bash
cd packages/supabase
npx tsx scripts/create-admin.ts
```

### What it does

1. ✅ Creates user in Supabase Auth with email `daniel@email.com`
2. ✅ Sets password to `Admin@2024!` (change this!)
3. ✅ Auto-confirms email
4. ✅ Creates profile with `account_type = 'admin'`
5. ✅ Sets `is_super_admin = true`
6. ✅ Verifies the admin was created correctly

### After Running

1. **Test login** in your app with:
   - Email: `daniel@email.com`
   - Password: `Admin@2024!`

2. **Change the password** immediately after first login

3. **Check console** - you should see:
   ```
   🔐 Admin access granted: {
     isSuperAdmin: true,
     userId: "...",
     email: "daniel@email.com"
   }
   ```

### Security Notes

⚠️ **IMPORTANT**:
- Never commit the service role key to git
- Change the default password immediately
- Use environment variables for credentials
- The service role key bypasses all RLS policies - keep it secret!

### Troubleshooting

**Error: "User already exists"**
- The user was already created
- Just run the SQL update to promote them to admin:
  ```sql
  UPDATE profiles 
  SET account_type = 'admin', is_super_admin = true
  WHERE email = 'daniel@email.com';
  ```

**Error: "Invalid service role key"**
- Check your Supabase project settings
- Make sure you're using the `service_role` key, not the `anon` key
