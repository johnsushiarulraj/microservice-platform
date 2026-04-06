package com.example.devconsole.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all non-API, non-static requests to index.html so React Router can handle them.
 * This is required for SPA (Single Page Application) routing to work.
 */
@Controller
public class SpaForwardController {

    @RequestMapping(value = {
        "/",
        "/login",
        "/create",
        "/services",
        "/data/sqs",
        "/data/s3",
        "/learn",
        "/learn/**",
        "/change-password"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
