package com.scheduler.app.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WeatherResponse {
    private String date;
    private double tempMax;
    private double tempMin;
    private int weatherCode;
}
