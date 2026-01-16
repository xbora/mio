import { getSignUpUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export const GET = async () => {
  // Redirect testers to the signup page for new user registration
  const signUpUrl = await getSignUpUrl();

  return redirect(signUpUrl);
};