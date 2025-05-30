-- Create users table that syncs with Clerk
create table if not exists public.users (
    id text primary key, -- This will be the Clerk user ID
    username text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.users enable row level security;

-- Create posts table
create table if not exists public.posts (
    id uuid default gen_random_uuid() primary key,
    user_id text references public.users(id) on delete cascade not null,
    caption text,
    image_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.posts enable row level security;

-- Create RLS policies

-- Users policies
create policy "Users can read all profiles"
    on public.users
    for select
    to authenticated
    using (true);

create policy "Users can update their own profile"
    on public.users
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Posts policies
create policy "Posts are viewable by everyone"
    on public.posts
    for select
    to authenticated
    using (true);

create policy "Users can create their own posts"
    on public.posts
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own posts"
    on public.posts
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
    on public.posts
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create function to handle user creation/updates
create or replace function public.handle_user_update()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql security definer;

-- Create function to handle post creation/updates
create or replace function public.handle_post_update()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_user_update
    before update on public.users
    for each row
    execute function public.handle_user_update();

create trigger on_post_update
    before update on public.posts
    for each row
    execute function public.handle_post_update();
