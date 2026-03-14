package com.scheduler.app.payload.response;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class JwtResponse {
	private String token;
	private String type = "Bearer";
	private UUID id;
	private String username;
	private List<String> roles;

	public JwtResponse(String accessToken, UUID id, String username, List<String> roles) {
		this.token = accessToken;
		this.id = id;
		this.username = username;
		this.roles = roles;
	}
}
