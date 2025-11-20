USE vet_buddy;

-- Drop table if exists
DROP TABLE IF EXISTS Backup_History;

-- Create Backup_History table
CREATE TABLE Backup_History (
    backup_id INT AUTO_INCREMENT PRIMARY KEY,
    backup_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    backup_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    file_size BIGINT DEFAULT 0,
    file_path VARCHAR(500),
    FOREIGN KEY (created_by) REFERENCES User_Login(user_id) ON DELETE CASCADE,
    INDEX idx_created_at (created_at),
    INDEX idx_status (backup_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grant permissions to admin_user
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_buddy.Backup_History TO 'admin_user'@'localhost';
FLUSH PRIVILEGES;