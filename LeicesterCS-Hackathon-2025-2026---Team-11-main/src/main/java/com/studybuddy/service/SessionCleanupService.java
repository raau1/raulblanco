package com.studybuddy.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class SessionCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(SessionCleanupService.class);

    @Autowired
    private Firestore firestore;

    // Run every minute to check for expired sessions
    // DISABLED - Manual cleanup only
    // @Scheduled(fixedRate = 60000)
    public void cleanupExpiredSessions() {
        try {
            logger.info("Running session cleanup task...");

            QuerySnapshot snapshot = firestore.collection("sessions").get().get();
            List<QueryDocumentSnapshot> documents = snapshot.getDocuments();

            int deletedCount = 0;
            LocalDateTime now = LocalDateTime.now();

            for (QueryDocumentSnapshot doc : documents) {
                try {
                    String dateStr = doc.getString("date");
                    String timeStr = doc.getString("time");
                    Long duration = doc.getLong("duration");

                    if (dateStr != null && timeStr != null && duration != null) {
                        LocalDate sessionDate = LocalDate.parse(dateStr);
                        LocalTime sessionTime = LocalTime.parse(timeStr);
                        LocalDateTime sessionStart = LocalDateTime.of(sessionDate, sessionTime);
                        LocalDateTime sessionEnd = sessionStart.plusMinutes(duration);

                        // Only delete sessions that ended more than 24 hours ago
                        if (now.isAfter(sessionEnd.plusHours(24))) {
                            doc.getReference().delete().get();
                            deletedCount++;
                            logger.info("Deleted expired session: {} (ended at {})", doc.getId(), sessionEnd);
                        }
                    }
                } catch (Exception e) {
                    logger.error("Error processing session {}: {}", doc.getId(), e.getMessage());
                }
            }

            if (deletedCount > 0) {
                logger.info("Cleanup complete. Deleted {} expired session(s)", deletedCount);
            }

        } catch (Exception e) {
            logger.error("Error during session cleanup: {}", e.getMessage());
        }
    }
}
