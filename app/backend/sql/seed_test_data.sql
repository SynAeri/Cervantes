-- Seed test data for development and testing
-- Creates a professor, a class, and 5 students enrolled in Economics

-- Insert test professor
INSERT INTO professors (professor_id, name, email, password, institution)
VALUES
    ('prof-jordan', 'Professor Jordan', 'jordan@lamancha.edu', 'hashed_password_placeholder', 'La Mancha University')
ON CONFLICT (professor_id) DO NOTHING;

-- Insert Economics class
INSERT INTO classes (class_id, professor_id, subject, module, name)
VALUES
    ('econ-101', 'prof-jordan', 'Economics', 'Supply and Demand', 'Economics Year 10 - Supply and Demand')
ON CONFLICT (class_id) DO NOTHING;

-- Insert Digital Technologies class for testing
INSERT INTO classes (class_id, professor_id, subject, module, name)
VALUES
    ('digtech-101', 'prof-jordan', 'Digital Technologies', 'Database Design and Normalisation', 'Digital Technologies Year 10')
ON CONFLICT (class_id) DO NOTHING;

-- Insert 5 mock students
INSERT INTO students (student_id, first_name, last_name, email, subjects, extracurriculars)
VALUES
    ('student-001', 'Emma', 'Chen', 'emma.chen@student.edu', '["Economics", "Mathematics", "English"]'::jsonb, '["Debate Club", "Math Olympiad"]'::jsonb),
    ('student-002', 'Liam', 'O''Connor', 'liam.oconnor@student.edu', '["Economics", "History", "Business Studies"]'::jsonb, '["Student Council", "Chess Club"]'::jsonb),
    ('student-003', 'Aisha', 'Patel', 'aisha.patel@student.edu', '["Economics", "Science", "Geography"]'::jsonb, '["Environmental Club", "Robotics"]'::jsonb),
    ('student-004', 'Noah', 'Kim', 'noah.kim@student.edu', '["Economics", "Digital Technologies", "Mathematics"]'::jsonb, '["Coding Club", "Basketball"]'::jsonb),
    ('student-005', 'Zara', 'Ibrahim', 'zara.ibrahim@student.edu', '["Economics", "English", "Legal Studies"]'::jsonb, '["Mock Trial", "Drama"]'::jsonb)
ON CONFLICT (student_id) DO NOTHING;

-- Enroll all students in Economics class
INSERT INTO enrollments (enrollment_id, student_id, class_id)
VALUES
    ('enroll-001', 'student-001', 'econ-101'),
    ('enroll-002', 'student-002', 'econ-101'),
    ('enroll-003', 'student-003', 'econ-101'),
    ('enroll-004', 'student-004', 'econ-101'),
    ('enroll-005', 'student-005', 'econ-101')
ON CONFLICT DO NOTHING;
