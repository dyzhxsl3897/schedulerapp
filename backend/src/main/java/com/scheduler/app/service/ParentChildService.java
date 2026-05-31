package com.scheduler.app.service;

import com.scheduler.app.repository.ParentChildRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ParentChildService {

    @Autowired
    private ParentChildRepository parentChildRepository;

    /**
     * Resolves the target user ID for operations.
     * If forUserId is null or equals currentUserId, returns currentUserId (own data).
     * If forUserId is different, verifies current user is the parent of forUserId.
     *
     * @param forUserId     optional target user ID
     * @param currentUserId the authenticated user's ID
     * @return the resolved target user ID
     * @throws SecurityException if the current user is not authorized to act on behalf of forUserId
     */
    public UUID resolveTargetUserId(UUID forUserId, UUID currentUserId) {
        if (forUserId == null || forUserId.equals(currentUserId)) {
            return currentUserId;
        }
        if (!parentChildRepository.existsByParentIdAndChildId(currentUserId, forUserId)) {
            throw new SecurityException("You are not authorized to manage this user's data.");
        }
        return forUserId;
    }
}