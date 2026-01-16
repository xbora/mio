// Memkit WorkOS User Management
// Creates WorkOS user accounts in Memkit for Mio users

interface MemkitUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

interface MemkitUserResponse {
  success: boolean;
  workos_user_id?: string;
  error?: string;
}

/**
 * Create a WorkOS user account in Memkit
 * @param userData - User data from Mio WorkOS account
 * @returns Memkit WorkOS user ID or error
 */
export async function createMemkitUser(userData: MemkitUserData): Promise<MemkitUserResponse> {
  try {
    const memkitClientId = process.env.MEMKIT_WORKOS_CLIENT_ID;
    const memkitApiKey = process.env.MEMKIT_WORKOS_API_KEY;

    if (!memkitClientId || !memkitApiKey) {
      return {
        success: false,
        error: 'Missing Memkit WorkOS credentials'
      };
    }

    // Create user in Memkit using WorkOS Management API
    const response = await fetch('https://api.workos.com/user_management/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${memkitApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email_verified: true // Since user already verified in Mio
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create Memkit user:', errorText);
      return {
        success: false,
        error: `Memkit user creation failed: ${response.status}`
      };
    }

    const memkitUser = await response.json();
    console.log('✅ Created Memkit WorkOS user:', memkitUser.id);

    return {
      success: true,
      workos_user_id: memkitUser.id
    };

  } catch (error) {
    console.error('❌ Error creating Memkit user:', error);
    return {
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}