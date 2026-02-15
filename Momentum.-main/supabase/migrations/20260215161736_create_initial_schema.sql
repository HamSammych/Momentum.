/*
  # Create Initial Schema for Task Management App

  ## New Tables Created
  
  ### 1. profiles
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text, nullable)
  - `avatar_url` (text, nullable)
  - `bio` (text, nullable)
  - `onboarding_completed` (boolean, default false)
  - `current_streak` (integer, default 0)
  - `longest_streak` (integer, default 0)
  - `total_tasks_completed` (integer, default 0)
  - `preferences` (jsonb, default settings)
  - `is_public` (boolean, default false)
  - `accent_color` (text, default '#6366F1' - customizable accent color for UI theming)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 2. categories
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text, not null)
  - `color` (text, not null)
  - `icon` (text, default emoji)
  - `is_default` (boolean, default false)
  - `created_at` (timestamptz, default now())

  ### 3. tasks
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text, not null)
  - `description` (text, nullable)
  - `due_date` (timestamptz, nullable)
  - `priority` (text, default 'medium')
  - `status` (text, default 'todo')
  - `is_recurring` (boolean, default false)
  - `recurrence_pattern` (text, nullable)
  - `is_public` (boolean, default false)
  - `completed_at` (timestamptz, nullable)
  - `position` (integer, default 0)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 4. subtasks
  - `id` (uuid, primary key)
  - `task_id` (uuid, references tasks)
  - `title` (text, not null)
  - `completed` (boolean, default false)
  - `position` (integer, default 0)
  - `created_at` (timestamptz, default now())

  ### 5. task_categories (junction table)
  - `task_id` (uuid, references tasks)
  - `category_id` (uuid, references categories)
  - Primary key: (task_id, category_id)

  ### 6. task_attachments
  - `id` (uuid, primary key)
  - `task_id` (uuid, references tasks)
  - `file_name` (text, not null)
  - `file_url` (text, not null)
  - `file_type` (text, nullable)
  - `file_size` (integer, nullable)
  - `created_at` (timestamptz, default now())

  ### 7. follows (social feature)
  - `follower_id` (uuid, references profiles)
  - `following_id` (uuid, references profiles)
  - `created_at` (timestamptz, default now())
  - Primary key: (follower_id, following_id)

  ### 8. teams
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `description` (text, nullable)
  - `avatar_url` (text, nullable)
  - `created_by` (uuid, references profiles)
  - `invite_code` (text, unique, not null)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 9. team_members
  - `team_id` (uuid, references teams)
  - `user_id` (uuid, references profiles)
  - `role` (text, default 'member')
  - `joined_at` (timestamptz, default now())
  - Primary key: (team_id, user_id)

  ### 10. team_tasks
  - `id` (uuid, primary key)
  - `team_id` (uuid, references teams)
  - `created_by` (uuid, references profiles)
  - `assigned_to` (uuid, references profiles, nullable)
  - `title` (text, not null)
  - `description` (text, nullable)
  - `due_date` (timestamptz, nullable)
  - `priority` (text, default 'medium')
  - `status` (text, default 'todo')
  - `completed_at` (timestamptz, nullable)
  - `position` (integer, default 0)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 11. task_comments
  - `id` (uuid, primary key)
  - `task_id` (uuid, references team_tasks)
  - `user_id` (uuid, references profiles)
  - `content` (text, not null)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### 12. notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text, not null)
  - `title` (text, not null)
  - `message` (text, not null)
  - `data` (jsonb, default {})
  - `read` (boolean, default false)
  - `created_at` (timestamptz, default now())

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies for authenticated users to access their own data
  - Public profiles viewable if is_public is true
  - Team members can view team content
  - Cascade deletes configured for data integrity

  ## Important Notes
  1. All tables have RLS enabled for security
  2. Users can only access their own data by default
  3. Public profiles and tasks are viewable by all authenticated users
  4. Team data is shared among team members
  5. Cascading deletes ensure data integrity
  6. Default accent_color is set to '#6366F1' (indigo)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  onboarding_completed boolean DEFAULT false,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_tasks_completed integer DEFAULT 0,
  preferences jsonb DEFAULT '{"theme": "dark", "notifications": true}'::jsonb,
  is_public boolean DEFAULT false,
  accent_color text DEFAULT '#6366F1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL,
  icon text DEFAULT '📁',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text DEFAULT 'medium',
  status text DEFAULT 'todo',
  is_recurring boolean DEFAULT false,
  recurrence_pattern text,
  is_public boolean DEFAULT false,
  completed_at timestamptz,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create task_categories junction table
CREATE TABLE IF NOT EXISTS task_categories (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, category_id)
);

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now()
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invite_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- Create team_tasks table
CREATE TABLE IF NOT EXISTS team_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text DEFAULT 'medium',
  status text DEFAULT 'todo',
  completed_at timestamptz,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES team_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for subtasks
CREATE POLICY "Users can view subtasks of own tasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subtasks to own tasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subtasks of own tasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subtasks of own tasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- RLS Policies for task_categories
CREATE POLICY "Users can view task_categories for own tasks"
  ON task_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_categories.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert task_categories for own tasks"
  ON task_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_categories.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task_categories for own tasks"
  ON task_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_categories.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- RLS Policies for task_attachments
CREATE POLICY "Users can view attachments of own tasks"
  ON task_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments to own tasks"
  ON task_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments from own tasks"
  ON task_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_attachments.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- RLS Policies for follows
CREATE POLICY "Users can view own follows"
  ON follows FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can insert own follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- RLS Policies for teams
CREATE POLICY "Team members can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team admins can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

CREATE POLICY "Team admins can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

-- RLS Policies for team_members
CREATE POLICY "Team members can view team membership"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join teams"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team admins can update team membership"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "Team members can leave teams"
  ON team_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for team_tasks
CREATE POLICY "Team members can view team tasks"
  ON team_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create team tasks"
  ON team_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update team tasks"
  ON team_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete team tasks"
  ON team_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- RLS Policies for task_comments
CREATE POLICY "Team members can view task comments"
  ON task_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_tasks
      JOIN team_members ON team_members.team_id = team_tasks.team_id
      WHERE team_tasks.id = task_comments.task_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create task comments"
  ON task_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM team_tasks
      JOIN team_members ON team_members.team_id = team_tasks.team_id
      WHERE team_tasks.id = task_comments.task_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own task comments"
  ON task_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own task comments"
  ON task_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_categories_task_id ON task_categories(task_id);
CREATE INDEX IF NOT EXISTS idx_task_categories_category_id ON task_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_team_id ON team_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_tasks_assigned_to ON team_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_teams_updated_at') THEN
    CREATE TRIGGER update_teams_updated_at
      BEFORE UPDATE ON teams
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_tasks_updated_at') THEN
    CREATE TRIGGER update_team_tasks_updated_at
      BEFORE UPDATE ON team_tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_task_comments_updated_at') THEN
    CREATE TRIGGER update_task_comments_updated_at
      BEFORE UPDATE ON task_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;