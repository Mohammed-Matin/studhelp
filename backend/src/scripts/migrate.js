import pool from '../config/db.js';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running schema migration...');

        await client.query('CREATE SCHEMA IF NOT EXISTS student');

        const enumTypes = [
            { name: 'student.user_role', values: ['STUDENT', 'ADMIN'] },
            { name: 'student.user_status', values: ['PENDING', 'VERIFIED', 'REJECTED'] },
            { name: 'student.degree_type', values: ['BTECH', 'MTECH', 'PHD', 'MSC'] },
            { name: 'student.gender_type', values: ['MALE', 'FEMALE', 'OTHER'] },
            { name: 'student.club_role', values: ['CORE_COMMITTEE', 'EXECUTIVE', 'TECHNICAL', 'DESIGN', 'PUBLICITY', 'ADMINISTRATIVE_SPONSORS', 'CUSTOM'] },
            { name: 'student.event_status', values: ['UPCOMING', 'LIVE', 'PAST', 'POSTPONED', 'CANCELLED'] },
            { name: 'student.team_member_status', values: ['INVITED', 'JOINED', 'DECLINED', 'DROPPED'] },
        ];

        for (const enumType of enumTypes) {
            await client.query(`
                DO $$ BEGIN
                    CREATE TYPE ${enumType.name} AS ENUM (${enumType.values.map(v => `'${v}'`).join(', ')});
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
        }

        const tables = [
            `CREATE TABLE IF NOT EXISTS student.users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role student.user_role NOT NULL DEFAULT 'STUDENT',
                status student.user_status NOT NULL DEFAULT 'PENDING',
                full_name VARCHAR(150),
                admission_no VARCHAR(20) UNIQUE,
                branch VARCHAR(100),
                semester INTEGER,
                degree student.degree_type,
                gender student.gender_type,
                mobile_no VARCHAR(15) UNIQUE,
                bonafide_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Clubs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                logo_url TEXT,
                cover_url TEXT,
                member_count INTEGER DEFAULT 0,
                follower_count INTEGER DEFAULT 0,
                budget_balance DECIMAL(12, 2) DEFAULT 0.00,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Club_Members (
                user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
                role_tag student.club_role NOT NULL DEFAULT 'CUSTOM',
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, club_id)
            )`,
            `CREATE TABLE IF NOT EXISTS student.Club_Followers (
                user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
                followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, club_id)
            )`,
            `CREATE TABLE IF NOT EXISTS student.Club_Gallery_Images (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                caption VARCHAR(500),
                uploaded_by UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Club_Join_Requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
                requested_role student.club_role DEFAULT 'CUSTOM',
                message TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Follower_Messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                admin_reply TEXT,
                replied_by UUID REFERENCES student.users(id) ON DELETE SET NULL,
                replied_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Budget_Transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
                type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
                category VARCHAR(50) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                description TEXT,
                reference_type VARCHAR(20) DEFAULT 'MANUAL',
                reference_id UUID,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Club_Donations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
                donor_name VARCHAR(150),
                amount DECIMAL(12, 2) NOT NULL,
                message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                club_id UUID NOT NULL REFERENCES student.Clubs(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                banner_url TEXT,
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                status student.event_status NOT NULL DEFAULT 'UPCOMING',
                participation_type VARCHAR(10) NOT NULL DEFAULT 'BOTH',
                max_teams INTEGER,
                max_participants INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Event_Organizers (
                event_id UUID NOT NULL REFERENCES student.Events(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (event_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS student.Event_Registrations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_id UUID NOT NULL REFERENCES student.Events(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (event_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS student.Teams (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                event_id UUID NOT NULL REFERENCES student.Events(id) ON DELETE CASCADE,
                leader_id UUID NOT NULL REFERENCES student.users(id) ON DELETE RESTRICT,
                team_name VARCHAR(150) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (event_id, team_name)
            )`,
            `CREATE TABLE IF NOT EXISTS student.Team_Members (
                team_id UUID NOT NULL REFERENCES student.Teams(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                status student.team_member_status NOT NULL DEFAULT 'INVITED',
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (team_id, user_id)
            )`,
            `CREATE TABLE IF NOT EXISTS student.Messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                receiver_id UUID NOT NULL,
                is_group_chat BOOLEAN DEFAULT FALSE,
                group_type VARCHAR(50),
                content TEXT NOT NULL,
                is_anonymous BOOLEAN DEFAULT FALSE,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS student.Notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES student.users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                link VARCHAR(500),
                reference_type VARCHAR(50),
                reference_id UUID,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )`,
        ];

        for (const tableSql of tables) {
            await client.query(tableSql);
        }

        const alterColumns = [
            `ALTER TABLE student.Clubs ADD COLUMN IF NOT EXISTS logo_url TEXT`,
            `ALTER TABLE student.Clubs ADD COLUMN IF NOT EXISTS cover_url TEXT`,
            `ALTER TABLE student.Clubs ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0`,
            `ALTER TABLE student.Clubs ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0`,
            `ALTER TABLE student.Events ADD COLUMN IF NOT EXISTS banner_url TEXT`,
            `ALTER TABLE student.Events ADD COLUMN IF NOT EXISTS participation_type VARCHAR(10) DEFAULT 'BOTH'`,
            `ALTER TABLE student.Events ADD COLUMN IF NOT EXISTS max_teams INTEGER`,
            `ALTER TABLE student.Events ADD COLUMN IF NOT EXISTS max_participants INTEGER`,
        ];

        for (const alterSql of alterColumns) {
            try {
                await client.query(alterSql);
            } catch (e) {
                // Column might already exist in older PG versions
            }
        }

        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_username ON student.users(username)',
            'CREATE INDEX IF NOT EXISTS idx_users_email ON student.users(email)',
            'CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON student.Club_Members(club_id)',
            'CREATE INDEX IF NOT EXISTS idx_club_followers_club_id ON student.Club_Followers(club_id)',
            'CREATE INDEX IF NOT EXISTS idx_gallery_club_id ON student.Club_Gallery_Images(club_id)',
            'CREATE INDEX IF NOT EXISTS idx_join_requests_club_id ON student.Club_Join_Requests(club_id)',
            'CREATE INDEX IF NOT EXISTS idx_follower_messages_club_id ON student.Follower_Messages(club_id)',
            'CREATE INDEX IF NOT EXISTS idx_budget_club_id ON student.Budget_Transactions(club_id)',
            'CREATE INDEX IF NOT EXISTS idx_donations_club_id ON student.Club_Donations(club_id)',
            'CREATE INDEX IF NOT EXISTS idx_events_club_id ON student.Events(club_id)',
            'CREATE INDEX IF NOT EXISTS idx_events_status ON student.Events(status)',
            'CREATE INDEX IF NOT EXISTS idx_event_organizers_event ON student.Event_Organizers(event_id)',
            'CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON student.Event_Registrations(event_id)',
            'CREATE INDEX IF NOT EXISTS idx_teams_event_id ON student.Teams(event_id)',
            'CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON student.Messages(receiver_id)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON student.Notifications(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON student.Notifications(user_id, is_read)',
        ];

        for (const indexSql of indexes) {
            await client.query(indexSql);
        }

        const alterColumns2 = [
            `ALTER TABLE student.users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
        ];

        for (const alterSql of alterColumns2) {
            await client.query(alterSql);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
