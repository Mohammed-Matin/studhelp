import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const SALT_ROUNDS = 12;

async function seedDemo() {
    const client = await pool.connect();
    try {
        console.log('Seeding demo data...');

        let adminId, student1Id, student2Id, student3Id;

        // ── Users ──────────────────────────────────────────────
        const existingAdmin = await client.query(
            "SELECT id FROM student.users WHERE role = 'ADMIN'"
        );
        if (existingAdmin.rows.length > 0) {
            adminId = existingAdmin.rows[0].id;
            console.log('Admin exists, id:', adminId);
        } else {
            const hash = await bcrypt.hash('admin123', SALT_ROUNDS);
            const r = await client.query(
                `INSERT INTO student.users (username, email, password_hash, role, status, full_name)
                 VALUES ('admin', 'admin@studhelp.com', $1, 'ADMIN', 'VERIFIED', 'System Admin')
                 RETURNING id`,
                [hash]
            );
            adminId = r.rows[0].id;
            console.log('Admin created, id:', adminId);
        }

        const existingStudents = await client.query("SELECT id FROM student.users WHERE role = 'STUDENT' LIMIT 1");
        if (existingStudents.rows.length > 0) {
            console.log('Student users already exist, skipping user creation.');
            const allStudents = await client.query("SELECT id FROM student.users WHERE role = 'STUDENT'");
            student1Id = allStudents.rows[0]?.id;
            student2Id = allStudents.rows[1]?.id;
            student3Id = allStudents.rows[2]?.id;
        } else {
            const hash1 = await bcrypt.hash('student123', SALT_ROUNDS);
            const hash2 = await bcrypt.hash('student123', SALT_ROUNDS);
            const hash3 = await bcrypt.hash('student123', SALT_ROUNDS);

            const r1 = await client.query(
                `INSERT INTO student.users (username, email, password_hash, full_name, admission_no, branch, semester, degree, gender, mobile_no, role, status)
                 VALUES ('john_doe', 'john@svnit.ac.in', $1, 'John Doe', 'U21CS001', 'Computer Engineering', 6, 'BTECH', 'MALE', '9876543210', 'STUDENT', 'VERIFIED')
                 RETURNING id`, [hash1]
            );
            student1Id = r1.rows[0].id;

            const r2 = await client.query(
                `INSERT INTO student.users (username, email, password_hash, full_name, admission_no, branch, semester, degree, gender, mobile_no, role, status)
                 VALUES ('priya_sharma', 'priya@svnit.ac.in', $1, 'Priya Sharma', 'U21EC002', 'Electronics', 6, 'BTECH', 'FEMALE', '9876543211', 'STUDENT', 'VERIFIED')
                 RETURNING id`, [hash2]
            );
            student2Id = r2.rows[0].id;

            const r3 = await client.query(
                `INSERT INTO student.users (username, email, password_hash, full_name, admission_no, branch, semester, degree, gender, mobile_no, role, status)
                 VALUES ('rahul_v', 'rahul@svnit.ac.in', $1, 'Rahul Verma', 'U21ME003', 'Mechanical', 4, 'BTECH', 'MALE', '9876543212', 'STUDENT', 'PENDING')
                 RETURNING id`, [hash3]
            );
            student3Id = r3.rows[0].id;

            console.log('Created 3 student users');
        }

        // ── Clubs ──────────────────────────────────────────────
        const existingClubs = await client.query("SELECT id, name FROM student.Clubs LIMIT 1");
        let codingClubId, culturalClubId, sportsClubId;

        if (existingClubs.rows.length > 0) {
            console.log('Clubs already exist, skipping.');
            const clubs = await client.query("SELECT id, name FROM student.Clubs");
            clubs.rows.forEach(c => {
                if (c.name === 'Coding Club') codingClubId = c.id;
                if (c.name === 'Cultural Club') culturalClubId = c.id;
                if (c.name === 'Sports Club') sportsClubId = c.id;
            });
        } else {
            const c1 = await client.query(
                `INSERT INTO student.Clubs (name, description, logo_url, cover_url, member_count, follower_count, budget_balance)
                 VALUES ('Coding Club', 'For all things code — hackathons, workshops, and competitive programming.',
                         'https://placehold.co/200x200/3b82f6/ffffff?text=CC', 'https://placehold.co/1200x400/1e40af/ffffff?text=Coding+Club',
                         1, 2, 5000.00) RETURNING id`
            );
            codingClubId = c1.rows[0].id;

            const c2 = await client.query(
                `INSERT INTO student.Clubs (name, description, logo_url, cover_url, member_count, follower_count, budget_balance)
                 VALUES ('Cultural Club', 'Dance, drama, music, and all creative performances on campus.',
                         'https://placehold.co/200x200/ec4899/ffffff?text=CUL', 'https://placehold.co/1200x400/be185d/ffffff?text=Cultural+Club',
                         1, 2, 3000.00) RETURNING id`
            );
            culturalClubId = c2.rows[0].id;

            const c3 = await client.query(
                `INSERT INTO student.Clubs (name, description, logo_url, cover_url, member_count, follower_count, budget_balance)
                 VALUES ('Sports Club', 'Organizing inter-college tournaments, indoor & outdoor sports events.',
                         'https://placehold.co/200x200/22c55e/ffffff?text=SC', 'https://placehold.co/1200x400/15803d/ffffff?text=Sports+Club',
                         1, 1, 8000.00) RETURNING id`
            );
            sportsClubId = c3.rows[0].id;

            console.log('Created 3 clubs');
        }

        // ── Club Members ───────────────────────────────────────
        if (codingClubId && adminId) {
            await client.query(
                `INSERT INTO student.Club_Members (user_id, club_id, role_tag) VALUES ($1, $2, 'CORE_COMMITTEE') ON CONFLICT DO NOTHING`,
                [adminId, codingClubId]
            );
            if (student1Id) {
                await client.query(
                    `INSERT INTO student.Club_Members (user_id, club_id, role_tag) VALUES ($1, $2, 'TECHNICAL') ON CONFLICT DO NOTHING`,
                    [student1Id, codingClubId]
                );
            }
        }
        if (culturalClubId && adminId) {
            await client.query(
                `INSERT INTO student.Club_Members (user_id, club_id, role_tag) VALUES ($1, $2, 'CORE_COMMITTEE') ON CONFLICT DO NOTHING`,
                [adminId, culturalClubId]
            );
            if (student2Id) {
                await client.query(
                    `INSERT INTO student.Club_Members (user_id, club_id, role_tag) VALUES ($1, $2, 'PUBLICITY') ON CONFLICT DO NOTHING`,
                    [student2Id, culturalClubId]
                );
            }
        }
        if (sportsClubId && adminId) {
            await client.query(
                `INSERT INTO student.Club_Members (user_id, club_id, role_tag) VALUES ($1, $2, 'CORE_COMMITTEE') ON CONFLICT DO NOTHING`,
                [adminId, sportsClubId]
            );
        }

        // Update member counts
        for (const clubId of [codingClubId, culturalClubId, sportsClubId]) {
            if (clubId) {
                const count = await client.query('SELECT COUNT(*) FROM student.Club_Members WHERE club_id = $1', [clubId]);
                await client.query('UPDATE student.Clubs SET member_count = $1 WHERE id = $2', [parseInt(count.rows[0].count), clubId]);
            }
        }

        // ── Club Followers ─────────────────────────────────────
        if (codingClubId) {
            if (student1Id) await client.query(`INSERT INTO student.Club_Followers (user_id, club_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [student1Id, codingClubId]);
            if (student2Id) await client.query(`INSERT INTO student.Club_Followers (user_id, club_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [student2Id, codingClubId]);
        }
        if (culturalClubId) {
            if (student1Id) await client.query(`INSERT INTO student.Club_Followers (user_id, club_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [student1Id, culturalClubId]);
            if (student3Id) await client.query(`INSERT INTO student.Club_Followers (user_id, club_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [student3Id, culturalClubId]);
        }
        if (sportsClubId) {
            if (student2Id) await client.query(`INSERT INTO student.Club_Followers (user_id, club_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [student2Id, sportsClubId]);
        }

        for (const clubId of [codingClubId, culturalClubId, sportsClubId]) {
            if (clubId) {
                const count = await client.query('SELECT COUNT(*) FROM student.Club_Followers WHERE club_id = $1', [clubId]);
                await client.query('UPDATE student.Clubs SET follower_count = $1 WHERE id = $2', [parseInt(count.rows[0].count), clubId]);
            }
        }

        // ── Events ─────────────────────────────────────────────
        const existingEvents = await client.query("SELECT id FROM student.Events LIMIT 1");
        if (existingEvents.rows.length > 0) {
            console.log('Events already exist, skipping.');
        } else {
            const now = new Date();
            const day = 86400000;

            if (codingClubId) {
                // Coding Club events
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_teams, max_participants)
                     VALUES ($1, 'Hackathon 2026', 'A 24-hour coding competition to build innovative solutions.', $2, $3, 'UPCOMING', 'TEAM', 20, NULL)`,
                    [codingClubId, new Date(now.getTime() + 14 * day), new Date(now.getTime() + 15 * day)]
                );
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_participants)
                     VALUES ($1, 'Python Workshop', 'Hands-on workshop on Python for data science and automation.', $2, $3, 'UPCOMING', 'SOLO', 50)`,
                    [codingClubId, new Date(now.getTime() + 21 * day), new Date(now.getTime() + 21 * day + 4 * 3600000)]
                );
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_participants)
                     VALUES ($1, 'Code Debugging Contest', 'Find bugs, fix code, win prizes!', $2, $3, 'LIVE', 'SOLO', 100)`,
                    [codingClubId, new Date(now.getTime() - 2 * 3600000), new Date(now.getTime() + 4 * 3600000)]
                );
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_teams)
                     VALUES ($1, 'Algo Rush', 'Team-based algorithmic problem solving challenge.', $2, $3, 'PAST', 'TEAM', 15)`,
                    [codingClubId, new Date(now.getTime() - 30 * day), new Date(now.getTime() - 29 * day)]
                );
            }

            if (culturalClubId) {
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_participants)
                     VALUES ($1, 'Annual Cultural Fest', 'The biggest cultural event of the year with dance, drama, and music competitions.', $2, $3, 'UPCOMING', 'SOLO', 200)`,
                    [culturalClubId, new Date(now.getTime() + 30 * day), new Date(now.getTime() + 32 * day)]
                );
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_participants)
                     VALUES ($1, 'Open Mic Night', 'Showcase your talent — poetry, stand-up, music, and more!', $2, $3, 'UPCOMING', 'SOLO', 30)`,
                    [culturalClubId, new Date(now.getTime() + 7 * day), new Date(now.getTime() + 7 * day + 4 * 3600000)]
                );
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_participants)
                     VALUES ($1, 'Drama Workshop', 'Learn the art of theater and stage performance.', $2, $3, 'POSTPONED', 'SOLO', 25)`,
                    [culturalClubId, new Date(now.getTime() - 5 * day), new Date(now.getTime() - 5 * day + 6 * 3600000)]
                );
            }

            if (sportsClubId) {
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_teams)
                     VALUES ($1, 'Inter-College Cricket Tournament', 'Annual cricket tournament open to all colleges.', $2, $3, 'UPCOMING', 'TEAM', 16)`,
                    [sportsClubId, new Date(now.getTime() + 45 * day), new Date(now.getTime() + 47 * day)]
                );
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_participants)
                     VALUES ($1, 'Yoga Session', 'Morning yoga and meditation session for all.', $2, $3, 'LIVE', 'SOLO', 40)`,
                    [sportsClubId, new Date(now.getTime() - 1 * 3600000), new Date(now.getTime() + 1 * 3600000)]
                );
                await client.query(
                    `INSERT INTO student.Events (club_id, title, description, start_time, end_time, status, participation_type, max_participants)
                     VALUES ($1, 'Chess Championship', 'Classic chess tournament with knockout rounds.', $2, $3, 'PAST', 'SOLO', 32)`,
                    [sportsClubId, new Date(now.getTime() - 60 * day), new Date(now.getTime() - 60 * day + 8 * 3600000)]
                );
            }

            console.log('Created demo events');
        }

        // ── Teams ──────────────────────────────────────────────
        const existingTeams = await client.query("SELECT id FROM student.Teams LIMIT 1");
        if (existingTeams.rows.length > 0) {
            console.log('Teams already exist, skipping.');
        } else {
            if (codingClubId && student1Id) {
                const events = await client.query(
                    "SELECT id FROM student.Events WHERE club_id = $1 AND participation_type IN ('TEAM', 'BOTH') LIMIT 1",
                    [codingClubId]
                );
                if (events.rows.length > 0) {
                    const teamEventId = events.rows[0].id;
                    const t1 = await client.query(
                        `INSERT INTO student.Teams (event_id, leader_id, team_name) VALUES ($1, $2, 'Code Warriors') RETURNING id`,
                        [teamEventId, student1Id]
                    );
                    await client.query(
                        'INSERT INTO student.Team_Members (team_id, user_id, status) VALUES ($1, $2, $3)',
                        [t1.rows[0].id, student1Id, 'JOINED']
                    );
                    if (student2Id) {
                        await client.query(
                            'INSERT INTO student.Team_Members (team_id, user_id, status) VALUES ($1, $2, $3)',
                            [t1.rows[0].id, student2Id, 'INVITED']
                        );
                    }
                }
            }
            console.log('Created demo teams');
        }

        // ── Gallery ────────────────────────────────────────────
        const existingGallery = await client.query("SELECT id FROM student.Club_Gallery_Images LIMIT 1");
        if (existingGallery.rows.length > 0) {
            console.log('Gallery already exists, skipping.');
        } else {
            const galleryData = [
                { clubId: codingClubId, url: 'https://placehold.co/800x500/3b82f6/ffffff?text=Hackathon+2025', caption: 'Hackathon 2025 winners' },
                { clubId: codingClubId, url: 'https://placehold.co/800x500/6366f1/ffffff?text=Workshop', caption: 'Python workshop in progress' },
                { clubId: culturalClubId, url: 'https://placehold.co/800x500/ec4899/ffffff?text=Fest+2025', caption: 'Cultural Fest 2025' },
                { clubId: culturalClubId, url: 'https://placehold.co/800x500/f43f5e/ffffff?text=Drama', caption: 'Drama club performance' },
                { clubId: sportsClubId, url: 'https://placehold.co/800x500/22c55e/ffffff?text=Cricket', caption: 'Cricket tournament finals' },
                { clubId: sportsClubId, url: 'https://placehold.co/800x500/14b8a6/ffffff?text=Chess', caption: 'Chess championship' },
            ];

            for (const g of galleryData) {
                if (g.clubId && adminId) {
                    await client.query(
                        `INSERT INTO student.Club_Gallery_Images (club_id, image_url, caption, uploaded_by)
                         VALUES ($1, $2, $3, $4)`,
                        [g.clubId, g.url, g.caption, adminId]
                    );
                }
            }
            console.log('Created demo gallery images');
        }

        // ── Budget ─────────────────────────────────────────────
        const existingBudget = await client.query("SELECT id FROM student.Budget_Transactions LIMIT 1");
        if (existingBudget.rows.length > 0) {
            console.log('Budget transactions already exist, skipping.');
        } else {
            const budgetData = [
                { clubId: codingClubId, type: 'INCOME', category: 'SPONSORSHIP', amount: 10000, desc: 'TechCorp sponsorship' },
                { clubId: codingClubId, type: 'EXPENSE', category: 'EQUIPMENT', amount: 3000, desc: 'Purchased Arduino kits' },
                { clubId: culturalClubId, type: 'INCOME', category: 'GRANT', amount: 5000, desc: 'College cultural grant' },
                { clubId: culturalClubId, type: 'EXPENSE', category: 'DECORATION', amount: 1500, desc: 'Stage decorations' },
                { clubId: sportsClubId, type: 'INCOME', category: 'REGISTRATION', amount: 8000, desc: 'Tournament registration fees' },
                { clubId: sportsClubId, type: 'EXPENSE', category: 'EQUIPMENT', amount: 2000, desc: 'Sports equipment' },
            ];

            for (const b of budgetData) {
                if (b.clubId) {
                    await client.query(
                        `INSERT INTO student.Budget_Transactions (club_id, type, category, amount, description)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [b.clubId, b.type, b.category, b.amount, b.desc]
                    );

                    const sign = b.type === 'INCOME' ? '+' : '-';
                    await client.query(
                        `UPDATE student.Clubs SET budget_balance = budget_balance ${sign} $1 WHERE id = $2`,
                        [b.amount, b.clubId]
                    );
                }
            }
            console.log('Created demo budget transactions');
        }

        // ── Sample DM Messages ─────────────────────────────────
        const existingMessages = await client.query("SELECT id FROM student.Messages LIMIT 1");
        if (existingMessages.rows.length > 0) {
            console.log('Messages already exist, skipping.');
        } else {
            if (adminId && student1Id && student2Id) {
                await client.query(
                    `INSERT INTO student.Messages (sender_id, receiver_id, is_group_chat, content)
                     VALUES ($1, $2, false, 'Hey John! Welcome to StudHelp. Let me know if you need any help.')`,
                    [adminId, student1Id]
                );
                await client.query(
                    `INSERT INTO student.Messages (sender_id, receiver_id, is_group_chat, content)
                     VALUES ($1, $2, false, 'Thanks admin! The platform looks great.')`,
                    [student1Id, adminId]
                );
                await client.query(
                    `INSERT INTO student.Messages (sender_id, receiver_id, is_group_chat, content)
                     VALUES ($1, $2, false, 'Hi Priya, interested in joining the Coding Club?')`,
                    [adminId, student2Id]
                );
            }
            console.log('Created sample messages');
        }

        // ── Event Organizers ───────────────────────────────────
        const existingOrg = await client.query("SELECT 1 FROM student.Event_Organizers LIMIT 1");
        if (existingOrg.rows.length > 0) {
            console.log('Event organizers already exist, skipping.');
        } else {
            if (codingClubId && adminId) {
                const events = await client.query("SELECT id FROM student.Events WHERE club_id = $1 LIMIT 2", [codingClubId]);
                for (const e of events.rows) {
                    await client.query(
                        'INSERT INTO student.Event_Organizers (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [e.id, adminId]
                    );
                }
            }
            console.log('Created event organizers');
        }

        console.log('\n✅ Demo data seeded successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Admin:   admin / admin123');
        console.log('  Student: john_doe / student123 (VERIFIED)');
        console.log('  Student: priya_sharma / student123 (VERIFIED)');
        console.log('  Student: rahul_v / student123 (PENDING)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
        console.error('Seed failed:', error.message);
        console.error(error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedDemo();
