// @ts-nocheck
interface BirthdayProfile { id: string; name: string | null; username: string; birthday?: string | null; avatar_url?: string | null; }

export function checkTodaysBirthdays(contacts: BirthdayProfile[]): BirthdayProfile[] {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayMMDD = `${mm}-${dd}`;
  return contacts.filter(c => {
    if (!c.birthday) return false;
    try {
      const d = new Date(c.birthday);
      const bMM = String(d.getMonth() + 1).padStart(2, "0");
      const bDD = String(d.getDate()).padStart(2, "0");
      return `${bMM}-${bDD}` === todayMMDD;
    } catch { return false; }
  });
}

export function isBirthdayToday(birthday: string | null | undefined): boolean {
  if (!birthday) return false;
  try {
    const d = new Date(birthday);
    const today = new Date();
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  } catch { return false; }
}
