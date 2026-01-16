import { withAuth } from "@workos-inc/authkit-nextjs";
import { AccountPhoneSection } from "@/components/account-phone-section";
import { NavHeader } from "../components/nav-header";
import { Footer } from "../components/footer";
import { AccessTokenField } from "@/components/access-token-field";
import { AccountAINameSection } from "@/components/account-ai-name-section";
import { getSupabaseUser } from "@/lib/supabase-users";
import styles from "../components/authenticated-layout.module.css";

export default async function AccountPage() {
  const { user, role, permissions } = await withAuth({ ensureSignedIn: true });
  const supabaseUser = await getSupabaseUser(user.id);

  const userFields = [
    ["First name", user?.firstName],
    ["Last name", user?.lastName],
    ["Email", user?.email],
    role ? ["Role", role] : [],
    permissions ? ["Permissions", permissions] : [],
  ].filter((arr) => arr.length > 0);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.card}>
          <NavHeader activePage="account" />

          <main className={`${styles.mainContent} ${styles.mainContentTop}`}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 className={styles.heading}>Email your AI at ai@mio.fyi</h1>
            </div>

            <AccountAINameSection workosUserId={user.id} initialAiName={supabaseUser?.ai_name || null} />

            <AccountPhoneSection workosUserId={user.id} />

            {userFields && (
              <div className={styles.section}>
                <h2 className={styles.sectionHeading}>Profile Information</h2>
                <div className={styles.formGroup}>
                  {userFields.map(([label, value]) => (
                    <div className={styles.formRow} key={String(label)}>
                      <span className={styles.formLabel}>{label}</span>
                      <input
                        type="text"
                        value={String(value) || ""}
                        readOnly
                        className={styles.formInput}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user?.id && (
              <div className={styles.section}>
                <AccessTokenField token={user.id} />
              </div>
            )}
          </main>
        </div>
        <div className={styles.footerWrapper}>
          <Footer />
        </div>
      </div>
    </div>
  );
}
