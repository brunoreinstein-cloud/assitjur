-- Associate the ADMIN user with the Hubjuria Admin organization
UPDATE profiles 
SET organization_id = 'f794ba63-47ba-4a04-ba57-dffe0de045c0'
WHERE user_id = 'fe02bba8-586d-4d0a-b61a-c4b2a3b69156' AND role = 'ADMIN';