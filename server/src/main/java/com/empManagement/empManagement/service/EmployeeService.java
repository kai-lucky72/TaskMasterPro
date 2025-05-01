
package com.empManagement.empManagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.empManagement.empManagement.model.Employee;
import com.empManagement.empManagement.repository.EmployeeRepository;

@Service
public class EmployeeService {
    
    @Autowired
    private EmployeeRepository employeeRepo;

    // Your existing methods with corrected references to employeeRepo instead of bRepo
    // and Employee instead of employee
}
