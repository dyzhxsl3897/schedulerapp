package com.scheduler.app.controller;

import com.scheduler.app.model.ParentChild;
import com.scheduler.app.model.User;
import com.scheduler.app.payload.response.ChildResponse;
import com.scheduler.app.payload.response.MessageResponse;
import com.scheduler.app.repository.ParentChildRepository;
import com.scheduler.app.repository.UserRepository;
import com.scheduler.app.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/parent-children")
public class ParentChildController {

    @Autowired
    private ParentChildRepository parentChildRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<ChildResponse>> getChildren() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID parentId = userDetails.getId();

        List<ParentChild> relations = parentChildRepository.findByParentId(parentId);
        if (relations.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<UUID> childIds = relations.stream()
                .map(ParentChild::getChildId)
                .collect(Collectors.toList());

        Map<UUID, String> usernameMap = userRepository.findAllById(childIds).stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        List<ChildResponse> result = relations.stream()
                .map(r -> new ChildResponse(r.getChildId(), usernameMap.get(r.getChildId()), r.getCreatedAt()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> addChild(@RequestBody Map<String, String> body) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID parentId = userDetails.getId();

        String childUsername = body.get("username");
        if (childUsername == null || childUsername.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is required."));
        }

        User child = userRepository.findByUsername(childUsername.trim())
                .orElse(null);
        if (child == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User not found."));
        }

        UUID childId = child.getId();
        if (childId.equals(parentId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Cannot add yourself as a child."));
        }

        if (parentChildRepository.existsByParentIdAndChildId(parentId, childId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: This child is already added."));
        }

        ParentChild relation = new ParentChild(parentId, childId);
        parentChildRepository.save(relation);

        return ResponseEntity.ok(new ChildResponse(childId, child.getUsername(), relation.getCreatedAt()));
    }

    @DeleteMapping("/{childId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> removeChild(@PathVariable UUID childId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID parentId = userDetails.getId();

        if (!parentChildRepository.existsByParentIdAndChildId(parentId, childId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: This relationship does not exist."));
        }

        parentChildRepository.deleteByParentIdAndChildId(parentId, childId);
        return ResponseEntity.ok(new MessageResponse("Child removed successfully!"));
    }
}