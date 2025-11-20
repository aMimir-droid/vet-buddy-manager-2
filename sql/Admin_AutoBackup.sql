DELIMITER $$

CREATE EVENT auto_daily_backup
ON SCHEDULE EVERY 1 DAY
STARTS CONCAT(CURDATE() + INTERVAL 1 DAY, ' 02:00:00')
DO
BEGIN
    DECLARE backup_name VARCHAR(255);
    DECLARE filepath VARCHAR(500);
    
    SET backup_name = CONCAT('auto_daily_', DATE_FORMAT(NOW(), '%Y-%m-%d_%H-%i-%s'));
    SET filepath = CONCAT('C:\\CODINGAN\\vet-buddy-manager-2\\backend\\backups\\', backup_name, '.sql');
    
    INSERT INTO Backup_History 
    (backup_name, description, created_by, file_path, file_size, backup_status, created_at)
    VALUES 
    (backup_name, 'Automatic daily backup', 1, filepath, 0, 'scheduled', NOW());
END$$

DELIMITER ;