-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: vet_buddy
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_klinik`
--

DROP TABLE IF EXISTS `admin_klinik`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_klinik` (
  `admin_klinik_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik admin klinik',
  `user_id` int NOT NULL COMMENT 'Foreign Key ke tabel User_Login',
  `klinik_id` int NOT NULL COMMENT 'Foreign Key ke tabel Klinik',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu update terakhir',
  PRIMARY KEY (`admin_klinik_id`),
  UNIQUE KEY `unique_admin_klinik` (`user_id`,`klinik_id`) COMMENT 'Satu user hanya admin di satu klinik',
  KEY `fk_admin_klinik_klinik` (`klinik_id`),
  CONSTRAINT `fk_admin_klinik_klinik` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`klinik_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_admin_klinik_user` FOREIGN KEY (`user_id`) REFERENCES `user_login` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_klinik`
--

LOCK TABLES `admin_klinik` WRITE;
/*!40000 ALTER TABLE `admin_klinik` DISABLE KEYS */;
INSERT INTO `admin_klinik` VALUES (1,6,1,'2025-11-20 09:10:34','2025-11-20 09:10:34');
/*!40000 ALTER TABLE `admin_klinik` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditlog`
--

DROP TABLE IF EXISTS `auditlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditlog` (
  `log_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik log',
  `table_name` varchar(50) NOT NULL COMMENT 'Nama tabel yang dimodifikasi',
  `action_type` enum('INSERT','UPDATE','DELETE') NOT NULL COMMENT 'Jenis aksi (INSERT, UPDATE, DELETE)',
  `record_id` int DEFAULT NULL COMMENT 'ID record yang dimodifikasi',
  `klinik_id` int DEFAULT NULL COMMENT 'ID klinik terkait (untuk filter admin klinik)',
  `executed_by` varchar(100) DEFAULT NULL COMMENT 'Username yang melakukan aksi',
  `user_id` int DEFAULT NULL COMMENT 'ID user yang melakukan aksi',
  `role_name` varchar(50) DEFAULT NULL COMMENT 'Role user yang melakukan aksi',
  `old_data` json DEFAULT NULL COMMENT 'Data lama sebelum perubahan (JSON)',
  `new_data` json DEFAULT NULL COMMENT 'Data baru setelah perubahan (JSON)',
  `changes_summary` text COMMENT 'Ringkasan perubahan yang dilakukan',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP address user (untuk tracking)',
  `executed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu eksekusi',
  PRIMARY KEY (`log_id`),
  KEY `idx_table_action` (`table_name`,`action_type`),
  KEY `idx_executed_by` (`executed_by`),
  KEY `idx_executed_at` (`executed_at`),
  KEY `idx_klinik_id` (`klinik_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Enhanced audit log table untuk tracking perubahan data';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditlog`
--

LOCK TABLES `auditlog` WRITE;
/*!40000 ALTER TABLE `auditlog` DISABLE KEYS */;
INSERT INTO `auditlog` VALUES (1,'Hewan','INSERT',1,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 1, \"nama_hewan\": \"Mimi\", \"pawrent_id\": 1, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Betina\", \"tanggal_lahir\": \"2022-05-15\", \"jenis_hewan_id\": 1}','Hewan baru ditambahkan: Mimi (ID: 1)',NULL,'2025-11-20 09:10:34'),(2,'Hewan','INSERT',2,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 2, \"nama_hewan\": \"Bobby\", \"pawrent_id\": 1, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Jantan\", \"tanggal_lahir\": \"2021-08-20\", \"jenis_hewan_id\": 2}','Hewan baru ditambahkan: Bobby (ID: 2)',NULL,'2025-11-20 09:10:34'),(3,'Hewan','INSERT',3,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 3, \"nama_hewan\": \"Fluffy\", \"pawrent_id\": 2, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Betina\", \"tanggal_lahir\": \"2023-01-10\", \"jenis_hewan_id\": 1}','Hewan baru ditambahkan: Fluffy (ID: 3)',NULL,'2025-11-20 09:10:34'),(4,'Hewan','INSERT',4,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 4, \"nama_hewan\": \"Rex\", \"pawrent_id\": 3, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Jantan\", \"tanggal_lahir\": \"2020-12-05\", \"jenis_hewan_id\": 2}','Hewan baru ditambahkan: Rex (ID: 4)',NULL,'2025-11-20 09:10:34'),(5,'Hewan','INSERT',5,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 5, \"nama_hewan\": \"Snowball\", \"pawrent_id\": 3, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Jantan\", \"tanggal_lahir\": \"2022-09-18\", \"jenis_hewan_id\": 3}','Hewan baru ditambahkan: Snowball (ID: 5)',NULL,'2025-11-20 09:10:34'),(6,'Hewan','INSERT',6,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 6, \"nama_hewan\": \"Luna\", \"pawrent_id\": 4, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Betina\", \"tanggal_lahir\": \"2023-03-22\", \"jenis_hewan_id\": 1}','Hewan baru ditambahkan: Luna (ID: 6)',NULL,'2025-11-20 09:10:34'),(7,'Hewan','INSERT',7,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 7, \"nama_hewan\": \"Max\", \"pawrent_id\": 4, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Jantan\", \"tanggal_lahir\": \"2021-11-30\", \"jenis_hewan_id\": 2}','Hewan baru ditambahkan: Max (ID: 7)',NULL,'2025-11-20 09:10:34'),(8,'Hewan','INSERT',8,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 8, \"nama_hewan\": \"Coco\", \"pawrent_id\": 5, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Betina\", \"tanggal_lahir\": \"2023-07-14\", \"jenis_hewan_id\": 4}','Hewan baru ditambahkan: Coco (ID: 8)',NULL,'2025-11-20 09:10:34'),(9,'Hewan','INSERT',9,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 9, \"nama_hewan\": \"Buddy\", \"pawrent_id\": 5, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Jantan\", \"tanggal_lahir\": \"2022-02-28\", \"jenis_hewan_id\": 2}','Hewan baru ditambahkan: Buddy (ID: 9)',NULL,'2025-11-20 09:10:34'),(10,'Hewan','INSERT',10,NULL,'root',NULL,'root',NULL,'{\"hewan_id\": 10, \"nama_hewan\": \"Princess\", \"pawrent_id\": 6, \"status_hidup\": \"Hidup\", \"jenis_kelamin\": \"Betina\", \"tanggal_lahir\": \"2023-04-05\", \"jenis_hewan_id\": 1}','Hewan baru ditambahkan: Princess (ID: 10)',NULL,'2025-11-20 09:10:34'),(11,'Kunjungan','INSERT',1,1,'root',NULL,'root',NULL,'{\"catatan\": \"Kucing demam dan lemas\", \"hewan_id\": 1, \"dokter_id\": 1, \"klinik_id\": 1, \"booking_id\": null, \"kunjungan_id\": 1, \"waktu_kunjungan\": \"09:00:00.000000\", \"metode_pembayaran\": \"Cash\", \"tanggal_kunjungan\": \"2025-03-15\"}','Kunjungan baru dibuat untuk hewan ID: 1 oleh dokter ID: 1',NULL,'2025-11-20 09:10:34'),(12,'Kunjungan','INSERT',2,2,'root',NULL,'root',NULL,'{\"catatan\": \"Anjing mengalami diare\", \"hewan_id\": 4, \"dokter_id\": 3, \"klinik_id\": 2, \"booking_id\": null, \"kunjungan_id\": 2, \"waktu_kunjungan\": \"11:15:00.000000\", \"metode_pembayaran\": \"Cash\", \"tanggal_kunjungan\": \"2025-03-25\"}','Kunjungan baru dibuat untuk hewan ID: 4 oleh dokter ID: 3',NULL,'2025-11-20 09:10:34'),(13,'Kunjungan','INSERT',3,1,'root',NULL,'root',NULL,'{\"catatan\": \"Rujukan dari kunjungan sebelumnya - kucing masih lemas\", \"hewan_id\": 1, \"dokter_id\": 2, \"klinik_id\": 1, \"booking_id\": null, \"kunjungan_id\": 3, \"waktu_kunjungan\": \"15:30:00.000000\", \"metode_pembayaran\": \"Transfer\", \"tanggal_kunjungan\": \"2025-04-05\"}','Kunjungan baru dibuat untuk hewan ID: 1 oleh dokter ID: 2',NULL,'2025-11-20 09:10:34'),(14,'Kunjungan','INSERT',4,2,'root',NULL,'root',NULL,'{\"catatan\": \"Rujukan follow-up anjing diare - kondisi memburuk\", \"hewan_id\": 4, \"dokter_id\": 4, \"klinik_id\": 2, \"booking_id\": null, \"kunjungan_id\": 4, \"waktu_kunjungan\": \"16:00:00.000000\", \"metode_pembayaran\": \"E-Wallet\", \"tanggal_kunjungan\": \"2025-04-15\"}','Kunjungan baru dibuat untuk hewan ID: 4 oleh dokter ID: 4',NULL,'2025-11-20 09:10:34'),(15,'Kunjungan','INSERT',5,1,'root',NULL,'root',NULL,'{\"catatan\": \"Vaksinasi rutin anjing\", \"hewan_id\": 2, \"dokter_id\": 1, \"klinik_id\": 1, \"booking_id\": null, \"kunjungan_id\": 5, \"waktu_kunjungan\": \"10:30:00.000000\", \"metode_pembayaran\": \"Transfer\", \"tanggal_kunjungan\": \"2025-04-20\"}','Kunjungan baru dibuat untuk hewan ID: 2 oleh dokter ID: 1',NULL,'2025-11-20 09:10:34'),(16,'Kunjungan','INSERT',6,1,'root',NULL,'root',NULL,'{\"catatan\": \"Pemeriksaan rutin kucing\", \"hewan_id\": 3, \"dokter_id\": 2, \"klinik_id\": 1, \"booking_id\": null, \"kunjungan_id\": 6, \"waktu_kunjungan\": \"14:00:00.000000\", \"metode_pembayaran\": \"E-Wallet\", \"tanggal_kunjungan\": \"2025-05-10\"}','Kunjungan baru dibuat untuk hewan ID: 3 oleh dokter ID: 2',NULL,'2025-11-20 09:10:34'),(17,'Kunjungan','INSERT',7,2,'root',NULL,'root',NULL,'{\"catatan\": \"Kelinci tidak mau makan\", \"hewan_id\": 5, \"dokter_id\": 3, \"klinik_id\": 2, \"booking_id\": null, \"kunjungan_id\": 7, \"waktu_kunjungan\": \"08:45:00.000000\", \"metode_pembayaran\": \"Transfer\", \"tanggal_kunjungan\": \"2025-07-18\"}','Kunjungan baru dibuat untuk hewan ID: 5 oleh dokter ID: 3',NULL,'2025-11-20 09:10:34'),(18,'Kunjungan','INSERT',8,3,'root',NULL,'root',NULL,'{\"catatan\": \"Sterilisasi kucing betina\", \"hewan_id\": 6, \"dokter_id\": 4, \"klinik_id\": 3, \"booking_id\": null, \"kunjungan_id\": 8, \"waktu_kunjungan\": \"13:20:00.000000\", \"metode_pembayaran\": \"Cash\", \"tanggal_kunjungan\": \"2025-08-20\"}','Kunjungan baru dibuat untuk hewan ID: 6 oleh dokter ID: 4',NULL,'2025-11-20 09:10:34'),(19,'Mutasi_Obat','INSERT',1,1,'root',1,'root',NULL,'{\"qty\": 50, \"obat_id\": 1, \"klinik_id\": 1, \"mutasi_id\": 1, \"tipe_mutasi\": \"Masuk\", \"sumber_mutasi\": \"Pembelian\"}','Mutasi obat: Masuk - Qty: 50 - Sumber: Pembelian',NULL,'2025-11-20 09:10:34'),(20,'Mutasi_Obat','INSERT',2,1,'root',1,'root',NULL,'{\"qty\": 100, \"obat_id\": 2, \"klinik_id\": 1, \"mutasi_id\": 2, \"tipe_mutasi\": \"Masuk\", \"sumber_mutasi\": \"Pembelian\"}','Mutasi obat: Masuk - Qty: 100 - Sumber: Pembelian',NULL,'2025-11-20 09:10:34'),(21,'Mutasi_Obat','INSERT',3,2,'root',1,'root',NULL,'{\"qty\": 40, \"obat_id\": 5, \"klinik_id\": 2, \"mutasi_id\": 3, \"tipe_mutasi\": \"Masuk\", \"sumber_mutasi\": \"Pembelian\"}','Mutasi obat: Masuk - Qty: 40 - Sumber: Pembelian',NULL,'2025-11-20 09:10:34'),(22,'Booking','INSERT',1,1,'root',NULL,'root',NULL,'{\"status\": \"booked\", \"hewan_id\": 1, \"dokter_id\": 1, \"klinik_id\": 1, \"booking_id\": 1, \"pawrent_id\": 1, \"waktu_booking\": \"09:30:00.000000\", \"tanggal_booking\": \"2025-09-01\"}','Booking baru dibuat untuk tanggal: 2025-09-01 jam: 09:30:00',NULL,'2025-11-20 09:10:34'),(23,'Booking','INSERT',2,1,'root',NULL,'root',NULL,'{\"status\": \"booked\", \"hewan_id\": 3, \"dokter_id\": 2, \"klinik_id\": 1, \"booking_id\": 2, \"pawrent_id\": 2, \"waktu_booking\": \"11:00:00.000000\", \"tanggal_booking\": \"2025-09-02\"}','Booking baru dibuat untuk tanggal: 2025-09-02 jam: 11:00:00',NULL,'2025-11-20 09:10:34'),(24,'Booking','INSERT',3,2,'root',NULL,'root',NULL,'{\"status\": \"booked\", \"hewan_id\": null, \"dokter_id\": 3, \"klinik_id\": 2, \"booking_id\": 3, \"pawrent_id\": null, \"waktu_booking\": \"10:00:00.000000\", \"tanggal_booking\": \"2025-09-03\"}','Booking baru dibuat untuk tanggal: 2025-09-03 jam: 10:00:00',NULL,'2025-11-20 09:10:34'),(25,'User_Login','INSERT',NULL,NULL,'system',NULL,NULL,NULL,'{\"username\": \"admin\"}',NULL,NULL,'2025-11-20 09:10:34'),(26,'Kunjungan','INSERT',20,1,'vet_user',NULL,'vet_user',NULL,'{\"catatan\": \"sdawd\", \"hewan_id\": 9, \"dokter_id\": 2, \"klinik_id\": 1, \"booking_id\": null, \"kunjungan_id\": 20, \"waktu_kunjungan\": \"16:13:00.000000\", \"metode_pembayaran\": \"Transfer\", \"tanggal_kunjungan\": \"2025-11-20\"}','Kunjungan baru dibuat untuk hewan ID: 9 oleh dokter ID: 2',NULL,'2025-11-20 09:11:33'),(27,'Kunjungan','INSERT',21,1,'vet_user',NULL,'vet_user',NULL,'{\"catatan\": null, \"hewan_id\": 2, \"dokter_id\": 2, \"klinik_id\": 1, \"booking_id\": null, \"kunjungan_id\": 21, \"waktu_kunjungan\": \"17:02:00.000000\", \"metode_pembayaran\": \"Transfer\", \"tanggal_kunjungan\": \"2025-11-20\"}','Kunjungan baru dibuat untuk hewan ID: 2 oleh dokter ID: 2',NULL,'2025-11-20 10:00:34'),(28,'Booking','UPDATE',2,1,'vet_user',NULL,'vet_user','{\"status\": \"booked\", \"booking_id\": 2, \"waktu_booking\": \"11:00:00.000000\", \"tanggal_booking\": \"2025-09-02\"}','{\"status\": \"cancelled\", \"booking_id\": 2, \"waktu_booking\": \"11:00:00.000000\", \"tanggal_booking\": \"2025-09-02\"}','Status: booked -> cancelled; ',NULL,'2025-11-20 10:03:00'),(29,'Booking','UPDATE',2,1,'vet_user',NULL,'vet_user','{\"status\": \"cancelled\", \"booking_id\": 2, \"waktu_booking\": \"11:00:00.000000\", \"tanggal_booking\": \"2025-09-02\"}','{\"status\": \"booked\", \"booking_id\": 2, \"waktu_booking\": \"11:00:00.000000\", \"tanggal_booking\": \"2025-09-02\"}','Status: cancelled -> booked; ',NULL,'2025-11-20 10:03:01'),(30,'Kunjungan','INSERT',22,3,'admin_user',NULL,'admin_user',NULL,'{\"catatan\": null, \"hewan_id\": 2, \"dokter_id\": 5, \"klinik_id\": 3, \"booking_id\": null, \"kunjungan_id\": 22, \"waktu_kunjungan\": \"18:03:00.000000\", \"metode_pembayaran\": \"Cash\", \"tanggal_kunjungan\": \"2025-11-20\"}','Kunjungan baru dibuat untuk hewan ID: 2 oleh dokter ID: 5',NULL,'2025-11-20 11:03:27'),(31,'Kunjungan','INSERT',23,3,'admin_user',NULL,'admin_user',NULL,'{\"catatan\": \"123\", \"hewan_id\": 9, \"dokter_id\": 5, \"klinik_id\": 3, \"booking_id\": null, \"kunjungan_id\": 23, \"waktu_kunjungan\": \"18:04:00.000000\", \"metode_pembayaran\": \"Transfer\", \"tanggal_kunjungan\": \"2025-11-20\"}','Kunjungan baru dibuat untuk hewan ID: 9 oleh dokter ID: 5',NULL,'2025-11-20 11:04:54');
/*!40000 ALTER TABLE `auditlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_history`
--

DROP TABLE IF EXISTS `backup_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_history` (
  `backup_id` int NOT NULL AUTO_INCREMENT,
  `backup_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `backup_status` enum('pending','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `file_size` bigint DEFAULT '0',
  `file_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`backup_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_status` (`backup_status`),
  CONSTRAINT `backup_history_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `user_login` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_history`
--

LOCK TABLES `backup_history` WRITE;
/*!40000 ALTER TABLE `backup_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking` (
  `booking_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key Booking',
  `klinik_id` int NOT NULL COMMENT 'FK Klinik TEMPAT booking',
  `dokter_id` int NOT NULL COMMENT 'FK Dokter',
  `pawrent_id` int DEFAULT NULL COMMENT 'FK Pawrent jika sudah terdaftar',
  `hewan_id` int DEFAULT NULL COMMENT 'FK Hewan yang dibooking (pengganti nama_pengunjung)',
  `tanggal_booking` date NOT NULL COMMENT 'Tanggal booking',
  `waktu_booking` time NOT NULL COMMENT 'Jam booking',
  `status` enum('pending','booked','cancelled','done') DEFAULT 'pending' COMMENT 'Status appointment',
  `catatan` text COMMENT 'Catatan keluhan awal',
  PRIMARY KEY (`booking_id`),
  UNIQUE KEY `uq_booking` (`klinik_id`,`dokter_id`,`tanggal_booking`,`waktu_booking`),
  KEY `fk_booking_dokter` (`dokter_id`),
  KEY `fk_booking_pawrent` (`pawrent_id`),
  KEY `fk_booking_hewan` (`hewan_id`),
  KEY `idx_booking_date` (`tanggal_booking`),
  CONSTRAINT `fk_booking_dokter` FOREIGN KEY (`dokter_id`) REFERENCES `dokter` (`dokter_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_booking_hewan` FOREIGN KEY (`hewan_id`) REFERENCES `hewan` (`hewan_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_booking_klinik` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`klinik_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_booking_pawrent` FOREIGN KEY (`pawrent_id`) REFERENCES `pawrent` (`pawrent_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking`
--

LOCK TABLES `booking` WRITE;
/*!40000 ALTER TABLE `booking` DISABLE KEYS */;
INSERT INTO `booking` VALUES (1,1,1,1,1,'2025-09-01','09:30:00','booked','Kontrol demam untuk Mimi'),(2,1,2,2,3,'2025-09-02','11:00:00','booked','Vaksinasi rutin untuk Fluffy'),(3,2,3,NULL,NULL,'2025-09-03','10:00:00','booked','Konsultasi untuk tamu non-member');
/*!40000 ALTER TABLE `booking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detail_layanan`
--

DROP TABLE IF EXISTS `detail_layanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detail_layanan` (
  `kode_layanan` varchar(20) NOT NULL COMMENT 'Primary Key, identitas unik layanan',
  `nama_layanan` varchar(100) NOT NULL COMMENT 'Nama layanan',
  `deskripsi_layanan` varchar(255) DEFAULT NULL COMMENT 'Deskripsi layanan',
  `biaya_layanan` decimal(12,2) NOT NULL COMMENT 'Biaya layanan (Harga Master)',
  `deleted_at` datetime DEFAULT NULL COMMENT 'MODIFIKASI: Soft delete untuk menonaktifkan layanan',
  PRIMARY KEY (`kode_layanan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detail_layanan`
--

LOCK TABLES `detail_layanan` WRITE;
/*!40000 ALTER TABLE `detail_layanan` DISABLE KEYS */;
INSERT INTO `detail_layanan` VALUES ('DEN001','Perawatan Gigi','Pembersihan dan perawatan gigi hewan',350000.00,NULL),('EME001','Emergency','Penanganan kasus darurat',400000.00,NULL),('GRO001','Grooming','Perawatan kebersihan dan kecantikan hewan',100000.00,NULL),('KON001','Konsultasi Umum','Pemeriksaan kesehatan umum',150000.00,NULL),('LAB001','Tes Laboratorium','Pemeriksaan laboratorium darah/urine',250000.00,NULL),('STE001','Sterilisasi','Operasi sterilisasi untuk hewan',500000.00,NULL),('VAK001','Vaksinasi','Pemberian vaksin untuk pencegahan penyakit',200000.00,NULL),('XRA001','Rontgen','Pemeriksaan radiologi',300000.00,NULL);
/*!40000 ALTER TABLE `detail_layanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dokter`
--

DROP TABLE IF EXISTS `dokter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dokter` (
  `dokter_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik dokter',
  `title_dokter` varchar(20) NOT NULL COMMENT 'Gelar atau titel dokter (misal: drh., drh. Sp.KH)',
  `nama_dokter` varchar(100) NOT NULL COMMENT 'Nama lengkap dokter',
  `telepon_dokter` varchar(15) DEFAULT NULL COMMENT 'Nomor telepon dokter',
  `tanggal_mulai_kerja` date DEFAULT NULL COMMENT 'Tanggal mulai bekerja',
  `spesialisasi_id` int DEFAULT NULL COMMENT 'Foreign Key ke tabel Spesialisasi',
  `klinik_id` int DEFAULT NULL COMMENT 'Foreign Key ke tabel Klinik',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Status aktif dokter (true = aktif, false = non-aktif)',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete dokter',
  PRIMARY KEY (`dokter_id`),
  UNIQUE KEY `telepon_dokter` (`telepon_dokter`),
  KEY `fk_dokter_spesialisasi` (`spesialisasi_id`),
  KEY `fk_dokter_klinik` (`klinik_id`),
  KEY `idx_dokter_nama` (`nama_dokter`),
  CONSTRAINT `fk_dokter_klinik` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`klinik_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dokter_spesialisasi` FOREIGN KEY (`spesialisasi_id`) REFERENCES `spesialisasi` (`spesialisasi_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dokter`
--

LOCK TABLES `dokter` WRITE;
/*!40000 ALTER TABLE `dokter` DISABLE KEYS */;
INSERT INTO `dokter` VALUES (1,'drh.','Ahmad Suharto','081234567890','2020-01-15',1,1,1,NULL),(2,'drh. Sp.KH','Siti Nurhaliza','081234567891','2019-03-20',2,1,1,NULL),(3,'drh.','Budi Santoso','081234567892','2021-06-10',1,2,1,NULL),(4,'drh. Sp.KH','Maya Indira','081234567893','2020-09-05',2,2,1,NULL),(5,'drh.','Rizky Pratama','081234567894','2022-02-28',1,3,1,NULL);
/*!40000 ALTER TABLE `dokter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hewan`
--

DROP TABLE IF EXISTS `hewan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hewan` (
  `hewan_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik hewan',
  `nama_hewan` varchar(50) NOT NULL COMMENT 'Nama panggilan hewan',
  `tanggal_lahir` date DEFAULT NULL COMMENT 'Tanggal lahir hewan',
  `jenis_kelamin` enum('Jantan','Betina') DEFAULT NULL COMMENT 'Jenis kelamin hewan',
  `status_hidup` enum('Hidup','Mati') DEFAULT 'Hidup' COMMENT 'Status hidup hewan',
  `jenis_hewan_id` int NOT NULL COMMENT 'Foreign Key ke tabel Jenis_Hewan',
  `pawrent_id` int DEFAULT NULL COMMENT 'Foreign Key ke tabel Pawrent',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete hewan',
  PRIMARY KEY (`hewan_id`),
  KEY `fk_hewan_jenis` (`jenis_hewan_id`),
  KEY `fk_hewan_pawrent` (`pawrent_id`),
  KEY `idx_hewan_nama` (`nama_hewan`),
  CONSTRAINT `fk_hewan_jenis` FOREIGN KEY (`jenis_hewan_id`) REFERENCES `jenis_hewan` (`jenis_hewan_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_hewan_pawrent` FOREIGN KEY (`pawrent_id`) REFERENCES `pawrent` (`pawrent_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hewan`
--

LOCK TABLES `hewan` WRITE;
/*!40000 ALTER TABLE `hewan` DISABLE KEYS */;
INSERT INTO `hewan` VALUES (1,'Mimi','2022-05-15','Betina','Hidup',1,1,NULL),(2,'Bobby','2021-08-20','Jantan','Hidup',2,1,NULL),(3,'Fluffy','2023-01-10','Betina','Hidup',1,2,NULL),(4,'Rex','2020-12-05','Jantan','Hidup',2,3,NULL),(5,'Snowball','2022-09-18','Jantan','Hidup',3,3,NULL),(6,'Luna','2023-03-22','Betina','Hidup',1,4,NULL),(7,'Max','2021-11-30','Jantan','Hidup',2,4,NULL),(8,'Coco','2023-07-14','Betina','Hidup',4,5,NULL),(9,'Buddy','2022-02-28','Jantan','Hidup',2,5,NULL),(10,'Princess','2023-04-05','Betina','Hidup',1,6,NULL);
/*!40000 ALTER TABLE `hewan` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_validate_hewan_insert` BEFORE INSERT ON `hewan` FOR EACH ROW BEGIN
    
    IF NEW.tanggal_lahir > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Tanggal lahir tidak boleh di masa depan.';
    END IF;
    
    
    IF NEW.status_hidup IS NULL THEN
        SET NEW.status_hidup = 'Hidup';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_audit_hewan_insert` AFTER INSERT ON `hewan` FOR EACH ROW BEGIN
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        executed_by,
        user_id,
        role_name,
        new_data,
        changes_summary
    ) VALUES (
        'Hewan',
        'INSERT',
        NEW.hewan_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'hewan_id', NEW.hewan_id,
            'nama_hewan', NEW.nama_hewan,
            'jenis_hewan_id', NEW.jenis_hewan_id,
            'pawrent_id', NEW.pawrent_id,
            'tanggal_lahir', NEW.tanggal_lahir,
            'jenis_kelamin', NEW.jenis_kelamin,
            'status_hidup', NEW.status_hidup
        ),
        CONCAT('Hewan baru ditambahkan: ', NEW.nama_hewan, ' (ID: ', NEW.hewan_id, ')')
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_validate_hewan_update` BEFORE UPDATE ON `hewan` FOR EACH ROW BEGIN
    
    IF NEW.tanggal_lahir > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Tanggal lahir tidak boleh di masa depan.';
    END IF;
    
    
    IF OLD.status_hidup = 'Hidup' AND NEW.status_hidup = 'Mati' THEN
        INSERT INTO AuditLog (table_name, action_type, executed_by, old_data, new_data)
        VALUES (
            'Hewan',
            'UPDATE',
            USER(),
            JSON_OBJECT('hewan_id', OLD.hewan_id, 'nama_hewan', OLD.nama_hewan, 'status_hidup', 'Hidup'),
            JSON_OBJECT('hewan_id', NEW.hewan_id, 'nama_hewan', NEW.nama_hewan, 'status_hidup', 'Mati')
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_audit_hewan_update` AFTER UPDATE ON `hewan` FOR EACH ROW BEGIN
    DECLARE v_changes TEXT DEFAULT '';
    
    IF OLD.status_hidup != NEW.status_hidup THEN
        SET v_changes = CONCAT('Status Hidup: ', OLD.status_hidup, ' -> ', NEW.status_hidup, '; ');
    END IF;
    
    IF OLD.nama_hewan != NEW.nama_hewan THEN
        SET v_changes = CONCAT(v_changes, 'Nama: ', OLD.nama_hewan, ' -> ', NEW.nama_hewan, '; ');
    END IF;
    
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        executed_by,
        user_id,
        role_name,
        old_data,
        new_data,
        changes_summary
    ) VALUES (
        'Hewan',
        'UPDATE',
        NEW.hewan_id,
        GetCurrentUserInfo('username'),
        GetCurrentUserInfo('user_id'),
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'hewan_id', OLD.hewan_id,
            'nama_hewan', OLD.nama_hewan,
            'status_hidup', OLD.status_hidup,
            'tanggal_lahir', OLD.tanggal_lahir
        ),
        JSON_OBJECT(
            'hewan_id', NEW.hewan_id,
            'nama_hewan', NEW.nama_hewan,
            'status_hidup', NEW.status_hidup,
            'tanggal_lahir', NEW.tanggal_lahir
        ),
        IF(v_changes = '', 'Hewan diupdate', v_changes)
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_audit_hewan_delete` AFTER DELETE ON `hewan` FOR EACH ROW BEGIN
    INSERT INTO AuditLog (table_name, action_type, executed_by, old_data)
    VALUES (
        'Hewan',
        'DELETE',
        USER(),
        JSON_OBJECT(
            'hewan_id', OLD.hewan_id,
            'nama_hewan', OLD.nama_hewan,
            'tanggal_lahir', OLD.tanggal_lahir,
            'status_hidup', OLD.status_hidup
        )
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `jenis_hewan`
--

DROP TABLE IF EXISTS `jenis_hewan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jenis_hewan` (
  `jenis_hewan_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik jenis hewan',
  `nama_jenis_hewan` varchar(50) NOT NULL COMMENT 'Nama jenis hewan, contoh: Kucing, Anjing',
  `deskripsi_jenis_hewan` varchar(255) DEFAULT NULL COMMENT 'Deskripsi tambahan mengenai jenis hewan',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp',
  PRIMARY KEY (`jenis_hewan_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jenis_hewan`
--

LOCK TABLES `jenis_hewan` WRITE;
/*!40000 ALTER TABLE `jenis_hewan` DISABLE KEYS */;
INSERT INTO `jenis_hewan` VALUES (1,'Kucing','Hewan peliharaan keluarga kucing (Felidae)',NULL),(2,'Anjing','Hewan peliharaan keluarga anjing (Canidae)',NULL),(3,'Kelinci','Hewan mamalia kecil keluarga Leporidae',NULL),(4,'Hamster','Hewan pengerat kecil yang populer sebagai hewan peliharaan',NULL);
/*!40000 ALTER TABLE `jenis_hewan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `klinik`
--

DROP TABLE IF EXISTS `klinik`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `klinik` (
  `klinik_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik klinik',
  `nama_klinik` varchar(100) NOT NULL COMMENT 'Nama klinik',
  `alamat_klinik` varchar(200) NOT NULL COMMENT 'Alamat klinik',
  `telepon_klinik` varchar(15) DEFAULT NULL COMMENT 'Nomor telepon klinik',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp untuk klinik',
  PRIMARY KEY (`klinik_id`),
  UNIQUE KEY `telepon_klinik` (`telepon_klinik`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `klinik`
--

LOCK TABLES `klinik` WRITE;
/*!40000 ALTER TABLE `klinik` DISABLE KEYS */;
INSERT INTO `klinik` VALUES (1,'Pet Care Clinic','Jl. Sudirman No. 123, Jakarta','021-12345678',NULL),(2,'Animal Hospital Plus','Jl. Gatot Subroto No. 45, Bandung','022-87654321',NULL),(3,'Happy Pet Veterinary','Jl. Ahmad Yani No. 78, Surabaya','031-11223344',NULL);
/*!40000 ALTER TABLE `klinik` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kunjungan`
--

DROP TABLE IF EXISTS `kunjungan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kunjungan` (
  `kunjungan_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik kunjungan',
  `klinik_id` int NOT NULL COMMENT 'FK Klinik TEMPAT kunjungan',
  `hewan_id` int DEFAULT NULL COMMENT 'Foreign Key ke tabel Hewan',
  `dokter_id` int DEFAULT NULL COMMENT 'Foreign Key ke tabel Dokter',
  `tanggal_kunjungan` date NOT NULL COMMENT 'Tanggal kunjungan',
  `waktu_kunjungan` time NOT NULL COMMENT 'Waktu kunjungan',
  `catatan` text COMMENT 'Catatan atau keluhan',
  `metode_pembayaran` enum('Cash','Transfer','E-Wallet') NOT NULL COMMENT 'Metode pembayaran',
  `kunjungan_sebelumnya` int DEFAULT NULL COMMENT 'Relasi ke kunjungan sebelumnya (jika ada)',
  `booking_id` int DEFAULT NULL COMMENT 'FK ke Booking jika kunjungan berasal dari booking',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete kunjungan (rekam medis tetap ada)',
  PRIMARY KEY (`kunjungan_id`),
  UNIQUE KEY `uq_kunjungan_natural` (`klinik_id`,`hewan_id`,`dokter_id`,`tanggal_kunjungan`,`waktu_kunjungan`),
  KEY `fk_kunjungan_self` (`kunjungan_sebelumnya`),
  KEY `fk_kunjungan_booking` (`booking_id`),
  KEY `idx_kunjungan_tanggal` (`tanggal_kunjungan`),
  KEY `idx_kunjungan_hewan` (`hewan_id`),
  KEY `idx_kunjungan_dokter` (`dokter_id`),
  CONSTRAINT `fk_kunjungan_booking` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`booking_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_kunjungan_dokter` FOREIGN KEY (`dokter_id`) REFERENCES `dokter` (`dokter_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_kunjungan_hewan` FOREIGN KEY (`hewan_id`) REFERENCES `hewan` (`hewan_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_kunjungan_klinik` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`klinik_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_kunjungan_self` FOREIGN KEY (`kunjungan_sebelumnya`) REFERENCES `kunjungan` (`kunjungan_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kunjungan`
--

LOCK TABLES `kunjungan` WRITE;
/*!40000 ALTER TABLE `kunjungan` DISABLE KEYS */;
INSERT INTO `kunjungan` VALUES (24,3,9,5,'2025-11-20','18:07:00','asdasd','Transfer',NULL,NULL,NULL);
/*!40000 ALTER TABLE `kunjungan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kunjungan_obat`
--

DROP TABLE IF EXISTS `kunjungan_obat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kunjungan_obat` (
  `kunjungan_obat_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key unik untuk rincian obat',
  `kunjungan_id` int NOT NULL COMMENT 'Foreign Key ke tabel Kunjungan',
  `obat_id` int NOT NULL COMMENT 'Foreign Key ke tabel Obat',
  `qty` int NOT NULL COMMENT 'Jumlah obat yang diberikan',
  `harga_saat_itu` decimal(12,2) NOT NULL COMMENT 'Harga obat PADA SAAT transaksi',
  `dosis` varchar(50) DEFAULT NULL COMMENT 'Dosis obat',
  `frekuensi` varchar(50) DEFAULT NULL COMMENT 'Frekuensi pemakaian obat',
  PRIMARY KEY (`kunjungan_obat_id`),
  KEY `fk_kunjunganobat_kunjungan` (`kunjungan_id`),
  KEY `fk_kunjunganobat_obat` (`obat_id`),
  CONSTRAINT `fk_kunjunganobat_kunjungan` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan` (`kunjungan_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_kunjunganobat_obat` FOREIGN KEY (`obat_id`) REFERENCES `obat` (`obat_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kunjungan_obat`
--

LOCK TABLES `kunjungan_obat` WRITE;
/*!40000 ALTER TABLE `kunjungan_obat` DISABLE KEYS */;
INSERT INTO `kunjungan_obat` VALUES (1,1,1,1,50000.00,'500mg','2x sehari'),(2,1,2,1,15000.00,'250mg','3x sehari'),(3,1,3,1,25000.00,'1 tablet','1x sehari'),(4,4,5,1,45000.00,'250mg','2x sehari'),(5,4,6,1,60000.00,'20mg','1x sehari'),(6,5,3,1,25000.00,'1 tablet','1x sehari'),(7,5,11,1,30000.00,'150mg','2x sehari'),(8,6,1,1,50000.00,'500mg','3x sehari'),(9,6,4,1,75000.00,'5mg','1x sehari'),(10,8,13,1,70000.00,'50mg','2x sehari');
/*!40000 ALTER TABLE `kunjungan_obat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `layanan`
--

DROP TABLE IF EXISTS `layanan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `layanan` (
  `layanan_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key unik untuk rincian layanan',
  `kunjungan_id` int NOT NULL COMMENT 'Foreign Key ke tabel Kunjungan',
  `kode_layanan` varchar(20) NOT NULL COMMENT 'Foreign Key ke Detail_Layanan',
  `qty` int NOT NULL DEFAULT '1' COMMENT 'Jumlah layanan yang diberikan (misal: 2x suntik)',
  `biaya_saat_itu` decimal(12,2) NOT NULL COMMENT 'Harga layanan PADA SAAT transaksi',
  PRIMARY KEY (`layanan_id`),
  KEY `fk_layanan_kunjungan` (`kunjungan_id`),
  KEY `fk_layanan_detail` (`kode_layanan`),
  CONSTRAINT `fk_layanan_detail` FOREIGN KEY (`kode_layanan`) REFERENCES `detail_layanan` (`kode_layanan`) ON DELETE RESTRICT,
  CONSTRAINT `fk_layanan_kunjungan` FOREIGN KEY (`kunjungan_id`) REFERENCES `kunjungan` (`kunjungan_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `layanan`
--

LOCK TABLES `layanan` WRITE;
/*!40000 ALTER TABLE `layanan` DISABLE KEYS */;
INSERT INTO `layanan` VALUES (1,1,'KON001',1,150000.00),(2,1,'LAB001',1,250000.00),(3,2,'VAK001',1,200000.00),(4,3,'KON001',1,150000.00),(5,4,'KON001',1,150000.00),(6,4,'EME001',1,400000.00),(7,5,'KON001',1,150000.00),(8,5,'XRA001',1,300000.00),(9,6,'KON001',1,150000.00),(10,6,'LAB001',1,250000.00),(11,7,'STE001',1,500000.00),(12,7,'KON001',1,150000.00),(13,8,'KON001',1,150000.00),(14,8,'EME001',1,400000.00),(15,20,'LAB001',1,250000.00),(16,21,'VAK001',1,200000.00),(17,22,'VAK001',1,200000.00),(18,23,'LAB001',1,250000.00),(19,24,'LAB001',1,250000.00);
/*!40000 ALTER TABLE `layanan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mutasi_obat`
--

DROP TABLE IF EXISTS `mutasi_obat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mutasi_obat` (
  `mutasi_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key mutasi',
  `obat_id` int NOT NULL COMMENT 'FK ke Obat',
  `klinik_id` int NOT NULL COMMENT 'FK ke Klinik',
  `qty` int NOT NULL COMMENT 'Jumlah obat dalam mutasi (positif integer)',
  `tipe_mutasi` enum('Masuk','Keluar') NOT NULL COMMENT 'Jenis Mutasi',
  `sumber_mutasi` enum('Pembelian','Pemakaian','Retur','Penyesuaian') NOT NULL COMMENT 'Sumber mutasi',
  `tanggal_mutasi` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu mutasi',
  `user_id` int NOT NULL COMMENT 'User yang melakukan mutasi (FK ke User_Login)',
  `keterangan` varchar(255) DEFAULT NULL COMMENT 'Catatan opsional',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete mutasi (jika perlu revert but keep history)',
  PRIMARY KEY (`mutasi_id`),
  KEY `fk_mutasi_obat` (`obat_id`),
  KEY `fk_mutasi_klinik` (`klinik_id`),
  KEY `fk_mutasi_user` (`user_id`),
  CONSTRAINT `fk_mutasi_klinik` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`klinik_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mutasi_obat` FOREIGN KEY (`obat_id`) REFERENCES `obat` (`obat_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_mutasi_user` FOREIGN KEY (`user_id`) REFERENCES `user_login` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mutasi_obat`
--

LOCK TABLES `mutasi_obat` WRITE;
/*!40000 ALTER TABLE `mutasi_obat` DISABLE KEYS */;
INSERT INTO `mutasi_obat` VALUES (1,1,1,50,'Masuk','Pembelian','2025-11-20 09:10:34',1,'Stok awal pembelian',NULL),(2,2,1,100,'Masuk','Pembelian','2025-11-20 09:10:34',1,'Stok awal',NULL),(3,5,2,40,'Masuk','Pembelian','2025-11-20 09:10:34',1,'Stok awal',NULL);
/*!40000 ALTER TABLE `mutasi_obat` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_audit_mutasi_obat_insert` AFTER INSERT ON `mutasi_obat` FOR EACH ROW BEGIN
    INSERT INTO AuditLog (
        table_name,
        action_type,
        record_id,
        klinik_id,
        executed_by,
        user_id,
        role_name,
        new_data,
        changes_summary
    ) VALUES (
        'Mutasi_Obat',
        'INSERT',
        NEW.mutasi_id,
        NEW.klinik_id,
        GetCurrentUserInfo('username'),
        NEW.user_id,
        GetCurrentUserInfo('role_name'),
        JSON_OBJECT(
            'mutasi_id', NEW.mutasi_id,
            'obat_id', NEW.obat_id,
            'klinik_id', NEW.klinik_id,
            'tipe_mutasi', NEW.tipe_mutasi,
            'qty', NEW.qty,
            'sumber_mutasi', NEW.sumber_mutasi
        ),
        CONCAT('Mutasi obat: ', NEW.tipe_mutasi, ' - Qty: ', NEW.qty, ' - Sumber: ', NEW.sumber_mutasi)
    );
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `obat`
--

DROP TABLE IF EXISTS `obat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `obat` (
  `obat_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik obat',
  `nama_obat` varchar(100) NOT NULL COMMENT 'Nama obat',
  `kegunaan` varchar(255) DEFAULT NULL COMMENT 'Kegunaan obat',
  `harga_obat` decimal(12,2) NOT NULL COMMENT 'Harga satuan obat',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete timestamp',
  PRIMARY KEY (`obat_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `obat`
--

LOCK TABLES `obat` WRITE;
/*!40000 ALTER TABLE `obat` DISABLE KEYS */;
INSERT INTO `obat` VALUES (1,'Amoxicillin','Antibiotik untuk infeksi bakteri',50000.00,NULL),(2,'Paracetamol','Obat penurun panas dan pereda nyeri',15000.00,NULL),(3,'Vitamin B Complex','Suplemen vitamin B untuk kesehatan umum',25000.00,NULL),(4,'Dexamethasone','Anti-inflamasi dan imunosupresan',75000.00,NULL),(5,'Metronidazole','Antibiotik untuk infeksi parasit dan bakteri anaerob',45000.00,NULL),(6,'Omeprazole','Obat untuk masalah lambung',60000.00,NULL),(7,'Chloramphenicol','Antibiotik spektrum luas',40000.00,NULL),(8,'Furosemide','Diuretik untuk masalah jantung dan ginjal',35000.00,NULL),(9,'Prednisolone','Anti-inflamasi kortikosteroid',55000.00,NULL),(10,'Ciprofloxacin','Antibiotik fluoroquinolone',65000.00,NULL),(11,'Ranitidine','Penghambat H2 untuk masalah lambung',30000.00,NULL),(12,'Ivermectin','Obat antiparasit',80000.00,NULL),(13,'Tramadol','Analgesik untuk nyeri sedang hingga berat',70000.00,NULL),(14,'Ketoconazole','Antijamur untuk infeksi jamur',85000.00,NULL);
/*!40000 ALTER TABLE `obat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawrent`
--

DROP TABLE IF EXISTS `pawrent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawrent` (
  `pawrent_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik pemilik hewan',
  `nama_depan_pawrent` varchar(50) NOT NULL COMMENT 'Nama depan pemilik hewan',
  `nama_belakang_pawrent` varchar(50) NOT NULL COMMENT 'Nama belakang pemilik hewan',
  `alamat_pawrent` varchar(200) DEFAULT NULL COMMENT 'Alamat lengkap pemilik hewan',
  `kota_pawrent` varchar(100) DEFAULT NULL COMMENT 'Kota tempat tinggal pemilik hewan',
  `kode_pos_pawrent` varchar(10) DEFAULT NULL COMMENT 'Kode pos alamat pemilik',
  `dokter_id` int DEFAULT NULL COMMENT 'Foreign Key ke tabel Dokter',
  `nomor_hp` varchar(15) DEFAULT NULL COMMENT 'Nomor HP pemilik hewan',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete pawrent',
  PRIMARY KEY (`pawrent_id`),
  UNIQUE KEY `nomor_hp` (`nomor_hp`),
  KEY `fk_pawrent_dokter` (`dokter_id`),
  KEY `idx_pawrent_nama` (`nama_depan_pawrent`,`nama_belakang_pawrent`),
  CONSTRAINT `fk_pawrent_dokter` FOREIGN KEY (`dokter_id`) REFERENCES `dokter` (`dokter_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawrent`
--

LOCK TABLES `pawrent` WRITE;
/*!40000 ALTER TABLE `pawrent` DISABLE KEYS */;
INSERT INTO `pawrent` VALUES (1,'Andi','Wijaya','Jl. Merdeka No. 15','Jakarta','12345',1,'081234567890',NULL),(2,'Sari','Dewi','Jl. Pahlawan No. 22','Jakarta','12346',1,'082134567891',NULL),(3,'Bima','Sakti','Jl. Diponegoro No. 8','Bandung','40123',3,'083134567892',NULL),(4,'Linda','Sari','Jl. Veteran No. 31','Bandung','40124',4,'084134567893',NULL),(5,'Roni','Hartono','Jl. Pemuda No. 17','Surabaya','60111',5,'085134567894',NULL),(6,'Dian','Pratiwi','Jl. Kenangan No. 9','Surabaya','60112',5,'086134567895',NULL);
/*!40000 ALTER TABLE `pawrent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `role_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik role',
  `role_name` varchar(50) NOT NULL COMMENT 'Nama role: Admin, Vet, Pawrent, Admin_Klinik',
  `description` varchar(255) DEFAULT NULL COMMENT 'Deskripsi role',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (1,'admin','Administrator dengan akses penuh ke seluruh sistem'),(2,'vet','Dokter hewan yang dapat menangani kunjungan dan rekam medis'),(3,'pawrent','Pemilik hewan yang dapat melihat data hewan dan riwayat kunjungan'),(4,'admin_klinik','Admin Klinik yang hanya bisa mengelola data terkait klinik tertentu');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_dokter`
--

DROP TABLE IF EXISTS `shift_dokter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_dokter` (
  `shift_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key shift',
  `dokter_id` int NOT NULL COMMENT 'FK ke tabel Dokter',
  `hari_minggu` tinyint NOT NULL COMMENT '0=Sun ... 6=Sat',
  `jam_mulai` time NOT NULL COMMENT 'Jam mulai shift',
  `jam_selesai` time NOT NULL COMMENT 'Jam selesai shift',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Status shift aktif/tidak',
  PRIMARY KEY (`shift_id`),
  KEY `idx_shift_dokter_hari` (`dokter_id`,`hari_minggu`),
  CONSTRAINT `fk_shift_dokter` FOREIGN KEY (`dokter_id`) REFERENCES `dokter` (`dokter_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_dokter`
--

LOCK TABLES `shift_dokter` WRITE;
/*!40000 ALTER TABLE `shift_dokter` DISABLE KEYS */;
INSERT INTO `shift_dokter` VALUES (1,1,1,'08:00:00','12:00:00',1),(2,3,1,'08:00:00','12:00:00',1),(3,2,1,'12:00:00','17:00:00',1),(4,4,1,'12:00:00','17:00:00',1),(5,5,1,'17:00:00','22:00:00',1),(6,1,2,'08:00:00','12:00:00',1),(7,2,2,'08:00:00','12:00:00',1),(8,3,2,'12:00:00','17:00:00',1),(9,4,2,'12:00:00','17:00:00',1),(10,5,2,'17:00:00','22:00:00',1),(11,2,3,'08:00:00','12:00:00',1),(12,3,3,'08:00:00','12:00:00',1),(13,1,3,'12:00:00','17:00:00',1),(14,4,3,'12:00:00','17:00:00',1),(15,5,3,'17:00:00','22:00:00',1),(16,1,4,'08:00:00','12:00:00',1),(17,4,4,'08:00:00','12:00:00',1),(18,2,4,'12:00:00','17:00:00',1),(19,3,4,'12:00:00','17:00:00',1),(20,5,4,'17:00:00','22:00:00',1),(21,3,5,'08:00:00','12:00:00',1),(22,5,5,'08:00:00','12:00:00',1),(23,1,5,'12:00:00','17:00:00',1),(24,2,5,'12:00:00','17:00:00',1),(25,4,5,'17:00:00','22:00:00',1),(26,2,6,'08:00:00','12:00:00',1),(27,5,6,'08:00:00','12:00:00',1),(28,3,6,'12:00:00','17:00:00',1),(29,1,6,'12:00:00','17:00:00',1),(30,4,6,'17:00:00','22:00:00',1),(31,1,7,'08:00:00','12:00:00',1),(32,3,7,'08:00:00','12:00:00',1),(33,4,7,'12:00:00','17:00:00',1),(34,5,7,'12:00:00','17:00:00',1),(35,2,7,'17:00:00','22:00:00',1);
/*!40000 ALTER TABLE `shift_dokter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spesialisasi`
--

DROP TABLE IF EXISTS `spesialisasi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spesialisasi` (
  `spesialisasi_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik spesialisasi',
  `nama_spesialisasi` varchar(100) NOT NULL COMMENT 'Nama bidang spesialisasi dokter',
  `deskripsi_spesialisasi` varchar(255) DEFAULT NULL COMMENT 'Deskripsi tambahan mengenai spesialisasi',
  PRIMARY KEY (`spesialisasi_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spesialisasi`
--

LOCK TABLES `spesialisasi` WRITE;
/*!40000 ALTER TABLE `spesialisasi` DISABLE KEYS */;
INSERT INTO `spesialisasi` VALUES (1,'Bedah Umum','Bedah Umum - Spesialisasi dalam operasi dan pembedahan hewan'),(2,'Penyakit Dalam','Penyakit Dalam - Spesialisasi dalam diagnosis dan pengobatan penyakit internal hewan');
/*!40000 ALTER TABLE `spesialisasi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stok_obat`
--

DROP TABLE IF EXISTS `stok_obat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stok_obat` (
  `stok_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key stok obat',
  `obat_id` int NOT NULL COMMENT 'FK ke tabel Obat',
  `klinik_id` int NOT NULL COMMENT 'FK ke Klinik',
  `jumlah_stok` int NOT NULL DEFAULT '0' COMMENT 'Jumlah stok saat ini',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu update stok terakhir',
  PRIMARY KEY (`stok_id`),
  UNIQUE KEY `obat_id` (`obat_id`,`klinik_id`),
  KEY `fk_stok_klinik` (`klinik_id`),
  CONSTRAINT `fk_stok_klinik` FOREIGN KEY (`klinik_id`) REFERENCES `klinik` (`klinik_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stok_obat` FOREIGN KEY (`obat_id`) REFERENCES `obat` (`obat_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stok_obat`
--

LOCK TABLES `stok_obat` WRITE;
/*!40000 ALTER TABLE `stok_obat` DISABLE KEYS */;
INSERT INTO `stok_obat` VALUES (1,1,1,50,'2025-11-20 09:10:34'),(2,2,1,100,'2025-11-20 09:10:34'),(3,3,1,75,'2025-11-20 09:10:34'),(4,5,2,40,'2025-11-20 09:10:34'),(5,13,3,20,'2025-11-20 09:10:34'),(6,14,3,10,'2025-11-20 09:10:34');
/*!40000 ALTER TABLE `stok_obat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_login`
--

DROP TABLE IF EXISTS `user_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_login` (
  `user_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary Key, identitas unik user',
  `username` varchar(50) NOT NULL COMMENT 'Username untuk login',
  `email` varchar(100) NOT NULL COMMENT 'Email user',
  `password_hash` varchar(255) NOT NULL COMMENT 'Hashed password',
  `role_id` int NOT NULL COMMENT 'Foreign Key ke tabel Role',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Status aktif user',
  `dokter_id` int DEFAULT NULL COMMENT 'Foreign Key ke Dokter jika role = Vet',
  `pawrent_id` int DEFAULT NULL COMMENT 'Foreign Key ke Pawrent jika role = Pawrent',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan user',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu update terakhir',
  `last_login` timestamp NULL DEFAULT NULL COMMENT 'Waktu login terakhir user',
  `deleted_at` datetime DEFAULT NULL COMMENT 'Soft delete user',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_user_role` (`role_id`),
  KEY `fk_user_dokter` (`dokter_id`),
  KEY `fk_user_pawrent` (`pawrent_id`),
  KEY `idx_user_login_username` (`username`),
  KEY `idx_user_login_email` (`email`),
  CONSTRAINT `fk_user_dokter` FOREIGN KEY (`dokter_id`) REFERENCES `dokter` (`dokter_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_pawrent` FOREIGN KEY (`pawrent_id`) REFERENCES `pawrent` (`pawrent_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_login`
--

LOCK TABLES `user_login` WRITE;
/*!40000 ALTER TABLE `user_login` DISABLE KEYS */;
INSERT INTO `user_login` VALUES (1,'admin','admin@vetbuddy.com','$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO',1,1,NULL,NULL,'2025-11-20 09:10:34','2025-11-20 09:10:34',NULL,NULL),(2,'ahmad','ahmad@vetbuddy.com','$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLOd',2,1,1,NULL,'2025-11-20 09:10:34','2025-11-20 09:10:34',NULL,NULL),(3,'siti','siti@vetbuddy.com','$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO',2,1,2,NULL,'2025-11-20 09:10:34','2025-11-20 09:10:34',NULL,NULL),(4,'andi','andi@vetbuddy.com','$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO',3,1,NULL,1,'2025-11-20 09:10:34','2025-11-20 09:10:34',NULL,NULL),(5,'pawrent1','sari@vetbuddy.com','$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO',3,1,NULL,2,'2025-11-20 09:10:34','2025-11-20 09:10:34',NULL,NULL),(6,'admin_klinik1','admin_klinik1@vetbuddy.com','$2b$10$GB6PgZyfOr3uUPraPuDvb.rdisu9QajFDP738RBCjV6cJJ9xV.QLO',4,1,NULL,NULL,'2025-11-20 09:10:34','2025-11-20 09:10:34',NULL,NULL);
/*!40000 ALTER TABLE `user_login` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_validate_user_insert` BEFORE INSERT ON `user_login` FOR EACH ROW BEGIN
    
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Format email tidak valid.';
    END IF;
    
    
    IF LENGTH(NEW.password_hash) < 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: Password hash terlalu pendek.';
    END IF;
    
    
    IF NEW.is_active IS NULL THEN
        SET NEW.is_active = TRUE;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_user_updated_at` BEFORE UPDATE ON `user_login` FOR EACH ROW BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_audit_user_update` AFTER UPDATE ON `user_login` FOR EACH ROW BEGIN
    
    IF OLD.is_active != NEW.is_active THEN
        INSERT INTO AuditLog (table_name, action_type, executed_by, old_data, new_data)
        VALUES (
            'User_Login',
            'UPDATE',
            USER(),
            JSON_OBJECT('user_id', OLD.user_id, 'username', OLD.username, 'is_active', OLD.is_active),
            JSON_OBJECT('user_id', NEW.user_id, 'username', NEW.username, 'is_active', NEW.is_active)
        );
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-20 11:13:01
