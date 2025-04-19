package com.optiagent.backend.service;

import com.optiagent.backend.model.User;
import com.optiagent.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateUser(String id, User userUpdates) {
        User user = getUserById(id);
        
        if (userUpdates.getName() != null) {
            user.setName(userUpdates.getName());
        }
        
        if (userUpdates.getProfileImage() != null) {
            user.setProfileImage(userUpdates.getProfileImage());
        }
        
        return userRepository.save(user);
    }
}
