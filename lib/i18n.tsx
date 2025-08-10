'use client'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Locale = 'en' | 'de' | 'hu' | 'sk'
type Vars = Record<string, string | number | boolean | Date>

type Ctx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Vars) => string
}

const I18nCtx = createContext<Ctx>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = (localStorage.getItem('locale') as Locale | null) || 'en'
    setLocaleState(saved)
    document.documentElement.lang = saved
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
    document.documentElement.lang = l
  }

  const t = useMemo(() => {
    return (key: string, vars?: Vars) => {
      const dict = messages[locale] || messages.en
      const msg = dict[key] ?? messages.en[key] ?? key
      if (!vars) return msg
      return msg.replace(/\{(\w+)\}/g, (_, k: string) => {
        const v = vars[k]
        if (v instanceof Date) return v.toString()
        return String(v ?? '')
      })
    }
  }, [locale])

  return <I18nCtx.Provider value={{ locale, setLocale, t }}>{children}</I18nCtx.Provider>
}

// Hooks
export function useLocale() {
  return useContext(I18nCtx).locale
}
export function useSetLocale() {
  return useContext(I18nCtx).setLocale
}
export function useT() {
  return useContext(I18nCtx).t
}
export function useLang() {
  const { locale, setLocale } = useContext(I18nCtx)
  return { lang: locale, setLang: setLocale }
}

/* ================== DICTIONARY ================== */
const messages: Record<Locale, Record<string, string>> = {
  /* ---------------- EN ---------------- */
  en: {
    // General / UI
    app_name: 'Work Hours & Invoices',
    logout: 'Logout',
    tabs: 'Tabs',
    add_tab: 'Add tab',
    add_role: 'Add role',
    add_row: 'Add row',
    delete: 'Delete',
    remove: 'Remove',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    open: 'Open',
    search_tabs: 'Search tabs…',
    select_or_create: 'Select a tab or create a new one',
    delete_confirm: 'Delete this tab and its files?',
    backup_json: 'Backup (JSON)',
    restore_from_file: 'Restore from file',
    invalid_json: 'Invalid JSON',
    invalid_backup: 'Not a valid backup',
    imported_tabs: 'Imported {count} tab(s).',
    choose_workspace_first: 'Choose a workspace first',
    default_role: 'Default',
    unknown: 'Unknown',
    deleting: 'Deleting…',

    // Columns / labels
    date: 'Date',
    hours: 'Hours',
    rate: 'Rate',
    role: 'Role',
    notes: 'Notes',
    notes_placeholder: 'Optional notes…',
    images: 'Images',
    invoices: 'Invoices',
    upload_images: 'Upload images',
    upload_pdfs: 'Upload PDFs',
    invoice_hint: 'Invoice note',
    invoice_placeholder: 'e.g. INV-2025-08 • €3,240',
    tab_month_name: 'Tab / Month name',
    month_placeholder: 'e.g. August 2025',
    total: 'Total',
    total_hours: 'Total hours',
    total_amount: 'Total amount',
    what_worked_on: 'What did you work on?',

    // Workspaces
    workspaces: 'Workspaces',
    workspace: 'Workspace',
    new_workspace: 'New workspace',
    rename_workspace: 'Rename workspace',
    delete_workspace: 'Delete workspace',
    confirm_delete_workspace: 'Delete this workspace? This cannot be undone.',
    delete_workspace_confirm: 'Delete this workspace? This cannot be undone.',
    delete_workspace_help:
      'Delete this workspace, its members, and all tabs. Files in storage will also be removed (best effort).',
    members: 'Members',
    invites: 'Invites',
    invite: 'Invite',
    new_invite: 'New invite',
    invite_member: 'Invite Member',
    invite_manager: 'Invite Manager',
    invite_email_placeholder: 'teammate@email.com',
    send_invite: 'Send invite',
    pending_invites: 'Pending invites',
    revoke: 'Revoke',
    revoked: 'Revoked',
    owner: 'Owner',
    manager: 'Manager',
    member: 'Member',
    change_role: 'Change role',
    promote: 'Promote',
    demote: 'Demote',
    promote_to_manager: 'Promote to manager',
    demote_to_member: 'Demote to member',
    delete_tab_not_allowed: 'Only the owner or the assignee can delete this tab.',
    leave_workspace: 'Leave workspace',
    leave_workspace_confirm: 'Leave this workspace?',
    assignee: 'Assignee',
    all_members: 'All members',
    created_by: 'Created by',
    used_by: 'Used by',
    used_at: 'Used at {at}',
    expires_at: 'Expires at {at}',
    status_active: 'Active',
    status_expired: 'Expired',
    status_used: 'Used',
    status_revoked: 'Revoked',
    copy_link: 'Copy link',
    invite_link_copied: 'Invite link copied to clipboard: {url}',

    // Presence / Chat
    online: 'Online',
    offline: 'Offline',
    chat: 'Chat',
    type_message: 'Type a message…',
    delete_message_confirm: 'Delete this message?',
    you: 'You',

    // Landing
    hero_badge: 'New: Workspaces, roles & realtime chat',
    hero_title: 'Track hours. Prove work. Share flawlessly.',
    hero_desc:
      'A modern, installable app for teams and solo contractors. Photo proof, multiple invoice PDFs, roles & rates with automatic totals, analytics, and live chat — all synced and offline-ready.',
    get_started: 'Get started',
    see_pricing: 'See pricing',
    features_photo: 'Photo proof & multi-PDF',
    features_photo_desc: 'Attach images and multiple invoices per month. Everything in one place.',
    features_roles: 'Roles & rates',
    features_roles_desc: 'Professional hourly tracking with roles, rates, and automatic totals.',
    features_analytics: 'Analytics & chat',
    features_analytics_desc:
      'Insights at a glance plus realtime collaboration with presence.',
    pricing: 'Pricing',
    pricing_free: 'Free',
    pricing_support: 'Support',
    pricing_thank_you: 'Helps keep the app alive for everyone',
    contact: 'Contact',
    contact_desc: 'Questions, feedback, or need help? Email us and we’ll get right back to you.',

    // Analytics (component)
    analytics: 'Analytics',
    by_role_breakdown: 'By role breakdown',
    hours_by_day: 'Hours by day',
    total_earnings: 'Total earnings',
    roles_rates: 'Roles & rates',
    amount: 'Amount',
    actions: 'Actions',
    danger_zone: 'Danger zone',
    amount_by_role: 'Amount by role',
    daily_entries: 'Daily entries',
    totals_autosave: 'Totals auto-saved',
  },

  /* ---------------- DE ---------------- */
  de: {
    app_name: 'Arbeitsstunden & Rechnungen',
    logout: 'Abmelden',
    tabs: 'Tabs',
    add_tab: 'Tab hinzufügen',
    add_role: 'Rolle hinzufügen',
    add_row: 'Zeile hinzufügen',
    delete: 'Löschen',
    remove: 'Entfernen',
    edit: 'Bearbeiten',
    save: 'Speichern',
    cancel: 'Abbrechen',
    open: 'Öffnen',
    search_tabs: 'Tabs durchsuchen…',
    select_or_create: 'Wählen Sie einen Tab oder erstellen Sie einen neuen',
    delete_confirm: 'Diesen Tab und seine Dateien löschen?',
    backup_json: 'Sicherung (JSON)',
    restore_from_file: 'Aus Datei wiederherstellen',
    invalid_json: 'Ungültiges JSON',
    invalid_backup: 'Keine gültige Sicherung',
    imported_tabs: '{count} Tab(s) importiert.',
    choose_workspace_first: 'Zuerst einen Arbeitsbereich wählen',
    default_role: 'Standard',
    unknown: 'Unbekannt',
    deleting: 'Wird gelöscht…',

    date: 'Datum',
    hours: 'Stunden',
    rate: 'Satz',
    role: 'Rolle',
    notes: 'Notizen',
    notes_placeholder: 'Optionale Notizen…',
    images: 'Bilder',
    invoices: 'Rechnungen',
    upload_images: 'Bilder hochladen',
    upload_pdfs: 'PDFs hochladen',
    invoice_hint: 'Rechnungsvermerk',
    invoice_placeholder: 'z. B. INV-2025-08 • 3.240 €',
    tab_month_name: 'Tab / Monatsname',
    month_placeholder: 'z. B. August 2025',
    total: 'Summe',
    total_hours: 'Gesamtstunden',
    total_amount: 'Gesamtbetrag',
    what_worked_on: 'Woran gearbeitet?',

    workspaces: 'Arbeitsbereiche',
    workspace: 'Arbeitsbereich',
    new_workspace: 'Neuer Arbeitsbereich',
    rename_workspace: 'Arbeitsbereich umbenennen',
    delete_workspace: 'Arbeitsbereich löschen',
    confirm_delete_workspace:
      'Diesen Arbeitsbereich löschen? Dies kann nicht rückgängig gemacht werden.',
    delete_workspace_confirm:
      'Diesen Arbeitsbereich löschen? Dies kann nicht rückgängig gemacht werden.',
    delete_workspace_help:
      'Diesen Arbeitsbereich, seine Mitglieder und alle Tabs löschen. Dateien im Speicher werden ebenfalls entfernt (nach bestem Bemühen).',
    members: 'Mitglieder',
    invites: 'Einladungen',
    invite: 'Einladen',
    new_invite: 'Neue Einladung',
    invite_member: 'Mitglied einladen',
    invite_manager: 'Manager einladen',
    invite_email_placeholder: 'teamkollege@email.de',
    send_invite: 'Einladung senden',
    pending_invites: 'Ausstehende Einladungen',
    revoke: 'Widerrufen',
    revoked: 'Widerrufen',
    owner: 'Inhaber',
    manager: 'Manager',
    member: 'Mitglied',
    change_role: 'Rolle ändern',
    promote: 'Befördern',
    demote: 'Degradieren',
    promote_to_manager: 'Zum Manager befördern',
    demote_to_member: 'Zum Mitglied degradieren',
    delete_tab_not_allowed:
      'Nur der Inhaber oder die zugewiesene Person kann diesen Tab löschen.',
    leave_workspace: 'Arbeitsbereich verlassen',
    leave_workspace_confirm: 'Diesen Arbeitsbereich verlassen?',
    assignee: 'Zugewiesen',
    all_members: 'Alle Mitglieder',
    created_by: 'Erstellt von',
    used_by: 'Verwendet von',
    used_at: 'Verwendet am {at}',
    expires_at: 'Läuft ab am {at}',
    status_active: 'Aktiv',
    status_expired: 'Abgelaufen',
    status_used: 'Verwendet',
    status_revoked: 'Widerrufen',
    copy_link: 'Link kopieren',
    invite_link_copied: 'Einladungslink in die Zwischenablage kopiert: {url}',

    online: 'Online',
    offline: 'Offline',
    chat: 'Chat',
    type_message: 'Nachricht eingeben…',
    delete_message_confirm: 'Diese Nachricht löschen?',
    you: 'Sie',

    hero_badge: 'Neu: Arbeitsbereiche, Rollen & Echtzeit-Chat',
    hero_title: 'Arbeitsstunden verfolgen. Arbeit nachweisen. Nahtlos teilen.',
    hero_desc:
      'Eine moderne, installierbare App für Teams und Einzelunternehmer. Fotobeweis, mehrere PDF-Rechnungen, Rollen & Sätze mit automatischen Summen, Analysen und Live-Chat — alles synchron und offlinefähig.',
    get_started: 'Loslegen',
    see_pricing: 'Preise ansehen',
    features_photo: 'Fotobeweis & Multi-PDF',
    features_photo_desc:
      'Bilder und mehrere Rechnungen pro Monat anhängen. Alles an einem Ort.',
    features_roles: 'Rollen & Sätze',
    features_roles_desc:
      'Professionelle Zeiterfassung mit Rollen, Sätzen und automatischen Summen.',
    features_analytics: 'Analysen & Chat',
    features_analytics_desc:
      'Einblicke auf einen Blick plus Zusammenarbeit in Echtzeit.',
    pricing: 'Preise',
    pricing_free: 'Kostenlos',
    pricing_support: 'Support',
    pricing_thank_you: 'Hilft, die App für alle am Leben zu erhalten',
    contact: 'Kontakt',
    contact_desc:
      'Fragen, Feedback oder Hilfe benötigt? Schreiben Sie uns eine E-Mail.',

    analytics: 'Analysen',
    by_role_breakdown: 'Aufschlüsselung nach Rolle',
    hours_by_day: 'Stunden nach Tag',
    total_earnings: 'Gesamteinnahmen',
    roles_rates: 'Rollen & Sätze',
    amount: 'Betrag',
    actions: 'Aktionen',
    danger_zone: 'Gefahrenbereich',
    amount_by_role: 'Betrag nach Rolle',
    daily_entries: 'Tägliche Einträge',
    totals_autosave: 'Summen automatisch gespeichert',
  },

  /* ---------------- HU ---------------- */
  hu: {
    app_name: 'Munkaórák és Számlák',
    logout: 'Kijelentkezés',
    tabs: 'Fülek',
    add_tab: 'Új fül',
    add_role: 'Szerep hozzáadása',
    add_row: 'Sor hozzáadása',
    delete: 'Törlés',
    remove: 'Eltávolítás',
    edit: 'Szerkesztés',
    save: 'Mentés',
    cancel: 'Mégse',
    open: 'Megnyitás',
    search_tabs: 'Fülek keresése…',
    select_or_create: 'Válasszon egy fület vagy hozzon létre újat',
    delete_confirm: 'Törli ezt a fület és a fájljait?',
    backup_json: 'Biztonsági mentés (JSON)',
    restore_from_file: 'Visszaállítás fájlból',
    invalid_json: 'Érvénytelen JSON',
    invalid_backup: 'Érvénytelen biztonsági mentés',
    imported_tabs: '{count} fül importálva.',
    choose_workspace_first: 'Először válasszon munkaterületet',
    default_role: 'Alapértelmezett',
    unknown: 'Ismeretlen',
    deleting: 'Törlés…',

    date: 'Dátum',
    hours: 'Órák',
    rate: 'Díj',
    role: 'Szerep',
    notes: 'Jegyzetek',
    notes_placeholder: 'Opcionális megjegyzések…',
    images: 'Képek',
    invoices: 'Számlák',
    upload_images: 'Képek feltöltése',
    upload_pdfs: 'PDF feltöltése',
    invoice_hint: 'Számla megjegyzés',
    invoice_placeholder: 'pl. INV-2025-08 • 3 240 €',
    tab_month_name: 'Fül / Hónap neve',
    month_placeholder: 'pl. 2025. augusztus',
    total: 'Összesen',
    total_hours: 'Összes óra',
    total_amount: 'Végösszeg',
    what_worked_on: 'Min dolgozott?',

    workspaces: 'Munkaterületek',
    workspace: 'Munkaterület',
    new_workspace: 'Új munkaterület',
    rename_workspace: 'Munkaterület átnevezése',
    delete_workspace: 'Munkaterület törlése',
    confirm_delete_workspace:
      'Törli ezt a munkaterületet? Ez nem vonható vissza.',
    delete_workspace_confirm:
      'Törli ezt a munkaterületet? Ez nem vonható vissza.',
    delete_workspace_help:
      'Törli ezt a munkaterületet, tagjait és az összes fület. A tárhelyen lévő fájlok is törlődnek (lehetőségekhez mérten).',
    members: 'Tagok',
    invites: 'Meghívók',
    invite: 'Meghívás',
    new_invite: 'Új meghívó',
    invite_member: 'Tag meghívása',
    invite_manager: 'Menedzser meghívása',
    invite_email_placeholder: 'csapattars@email.hu',
    send_invite: 'Meghívó küldése',
    pending_invites: 'Függő meghívók',
    revoke: 'Visszavonás',
    revoked: 'Visszavonva',
    owner: 'Tulajdonos',
    manager: 'Menedzser',
    member: 'Tag',
    change_role: 'Szerep módosítása',
    promote: 'Előléptetés',
    demote: 'Lefokozás',
    promote_to_manager: 'Előléptetés menedzserré',
    demote_to_member: 'Lefokozás taggá',
    delete_tab_not_allowed:
      'Csak a tulajdonos vagy a hozzárendelt személy törölheti ezt a fület.',
    leave_workspace: 'Munkaterület elhagyása',
    leave_workspace_confirm: 'Elhagyja ezt a munkaterületet?',
    assignee: 'Hozzárendelt',
    all_members: 'Minden tag',
    created_by: 'Létrehozta',
    used_by: 'Felhasználta',
    used_at: 'Felhasználva ekkor: {at}',
    expires_at: 'Lejár ekkor: {at}',
    status_active: 'Aktív',
    status_expired: 'Lejárt',
    status_used: 'Felhasználva',
    status_revoked: 'Visszavonva',
    copy_link: 'Hivatkozás másolása',
    invite_link_copied: 'Meghívó linkje a vágólapra másolva: {url}',

    online: 'Online',
    offline: 'Offline',
    chat: 'Chat',
    type_message: 'Írjon üzenetet…',
    delete_message_confirm: 'Törli ezt az üzenetet?',
    you: 'Ön',

    hero_badge: 'Új: Munkaterületek, szerepek és valós idejű chat',
    hero_title: 'Munkaórák követése. Munka igazolása. Zökkenőmentes megosztás.',
    hero_desc:
      'Modern, telepíthető alkalmazás csapatoknak és egyéni vállalkozóknak. Fényképes igazolás, több PDF számla, szerepek és díjak automatikus összesítése, analitika és élő chat — mindez szinkronizálva és offline is.',
    get_started: 'Kezdés',
    see_pricing: 'Árak megtekintése',
    features_photo: 'Fényképes igazolás & több PDF',
    features_photo_desc:
      'Képek és több számla csatolása havonta. Minden egy helyen.',
    features_roles: 'Szerepek és díjak',
    features_roles_desc:
      'Professzionális órakövetés szerepekkel, díjakkal és automatikus összesítéssel.',
    features_analytics: 'Analitika & chat',
    features_analytics_desc:
      'Áttekintés egy pillantással és valós idejű együttműködés jelenléttel.',
    pricing: 'Árak',
    pricing_free: 'Ingyenes',
    pricing_support: 'Támogatás',
    pricing_thank_you: 'Segít életben tartani az alkalmazást mindenkinek',
    contact: 'Kapcsolat',
    contact_desc: 'Kérdése, visszajelzése van vagy segítség kell? Írjon nekünk e-mailt!',

    analytics: 'Analitika',
    by_role_breakdown: 'Szerepenkénti bontás',
    hours_by_day: 'Órák naponta',
    total_earnings: 'Összes bevétel',
    roles_rates: 'Szerepek és díjak',
    amount: 'Összeg',
    actions: 'Műveletek',
    danger_zone: 'Veszélyzóna',
    amount_by_role: 'Összeg szerepenként',
    daily_entries: 'Napi bejegyzések',
    totals_autosave: 'Összesítések automatikusan mentve',
  },

  /* ---------------- SK ---------------- */
  sk: {
    app_name: 'Pracovné hodiny a faktúry',
    logout: 'Odhlásiť sa',
    tabs: 'Karty',
    add_tab: 'Pridať kartu',
    add_role: 'Pridať rolu',
    add_row: 'Pridať riadok',
    delete: 'Odstrániť',
    remove: 'Odstrániť',
    edit: 'Upraviť',
    save: 'Uložiť',
    cancel: 'Zrušiť',
    open: 'Otvoriť',
    search_tabs: 'Hľadať karty…',
    select_or_create: 'Vyberte kartu alebo vytvorte novú',
    delete_confirm: 'Odstrániť túto kartu a jej súbory?',
    backup_json: 'Záloha (JSON)',
    restore_from_file: 'Obnoviť zo súboru',
    invalid_json: 'Neplatné JSON',
    invalid_backup: 'Neplatná záloha',
    imported_tabs: 'Importovaných {count} kariet.',
    choose_workspace_first: 'Najprv vyberte pracovný priestor',
    default_role: 'Predvolená',
    unknown: 'Neznáme',
    deleting: 'Odstraňuje sa…',

    date: 'Dátum',
    hours: 'Hodiny',
    rate: 'Sadzba',
    role: 'Rola',
    notes: 'Poznámky',
    notes_placeholder: 'Voliteľné poznámky…',
    images: 'Obrázky',
    invoices: 'Faktúry',
    upload_images: 'Nahrať obrázky',
    upload_pdfs: 'Nahrať PDF',
    invoice_hint: 'Poznámka k faktúre',
    invoice_placeholder: 'napr. INV-2025-08 • 3 240 €',
    tab_month_name: 'Karta / Názov mesiaca',
    month_placeholder: 'napr. august 2025',
    total: 'Spolu',
    total_hours: 'Spolu hodín',
    total_amount: 'Celková suma',
    what_worked_on: 'Na čom ste pracovali?',

    workspaces: 'Pracovné priestory',
    workspace: 'Pracovný priestor',
    new_workspace: 'Nový pracovný priestor',
    rename_workspace: 'Premenovať pracovný priestor',
    delete_workspace: 'Odstrániť pracovný priestor',
    confirm_delete_workspace:
      'Odstrániť tento pracovný priestor? Toto sa nedá vrátiť späť.',
    delete_workspace_confirm:
      'Odstrániť tento pracovný priestor? Toto sa nedá vrátiť späť.',
    delete_workspace_help:
      'Odstrániť tento pracovný priestor, jeho členov a všetky karty. Súbory v úložisku budú tiež odstránené (podľa možností).',
    members: 'Členovia',
    invites: 'Pozvánky',
    invite: 'Pozvať',
    new_invite: 'Nová pozvánka',
    invite_member: 'Pozvať člena',
    invite_manager: 'Pozvať manažéra',
    invite_email_placeholder: 'kolega@email.sk',
    send_invite: 'Poslať pozvánku',
    pending_invites: 'Čakajúce pozvánky',
    revoke: 'Odvolať',
    revoked: 'Odvolané',
    owner: 'Vlastník',
    manager: 'Manažér',
    member: 'Člen',
    change_role: 'Zmeniť rolu',
    promote: 'Povýšiť',
    demote: 'Znížiť',
    promote_to_manager: 'Povýšiť na manažéra',
    demote_to_member: 'Znížiť na člena',
    delete_tab_not_allowed:
      'Kartu môže odstrániť iba vlastník alebo pridelená osoba.',
    leave_workspace: 'Opustiť pracovný priestor',
    leave_workspace_confirm: 'Opustiť tento pracovný priestor?',
    assignee: 'Pridelený',
    all_members: 'Všetci členovia',
    created_by: 'Vytvoril',
    used_by: 'Použil',
    used_at: 'Použité {at}',
    expires_at: 'Platnosť do {at}',
    status_active: 'Aktívne',
    status_expired: 'Platnosť vypršala',
    status_used: 'Použité',
    status_revoked: 'Zrušené',
    copy_link: 'Skopírovať odkaz',
    invite_link_copied: 'Odkaz na pozvánku bol skopírovaný: {url}',

    online: 'Online',
    offline: 'Offline',
    chat: 'Chat',
    type_message: 'Napíšte správu…',
    delete_message_confirm: 'Odstrániť túto správu?',
    you: 'Vy',

    hero_badge: 'Nové: Pracovné priestory, roly a chat v reálnom čase',
    hero_title: 'Sledujte hodiny. Dokážte prácu. Zdieľajte bez problémov.',
    hero_desc:
      'Moderná, inštalovateľná aplikácia pre tímy a živnostníkov. Fotodôkaz, viac PDF faktúr, roly a sadzby s automatickými súčtami, analytika a živý chat — všetko synchronizované a dostupné offline.',
    get_started: 'Začať',
    see_pricing: 'Zobraziť ceny',
    features_photo: 'Fotodôkaz & viac PDF',
    features_photo_desc:
      'Priložte obrázky a viac faktúr mesačne. Všetko na jednom mieste.',
    features_roles: 'Roly a sadzby',
    features_roles_desc:
      'Profesionálne sledovanie hodín s rolami, sadzbami a automatickými súčtami.',
    features_analytics: 'Analytika & chat',
    features_analytics_desc:
      'Prehľad na prvý pohľad a spolupráca v reálnom čase.',
    pricing: 'Cenník',
    pricing_free: 'Zadarmo',
    pricing_support: 'Podpora',
    pricing_thank_you: 'Pomáha udržať aplikáciu pri živote pre všetkých',
    contact: 'Kontakt',
    contact_desc:
      'Otázky alebo pomoc? Napíšte nám e-mail.',

    analytics: 'Analytika',
    by_role_breakdown: 'Rozpis podľa rolí',
    hours_by_day: 'Hodiny podľa dňa',
    total_earnings: 'Celkové zárobky',
    roles_rates: 'Roly a sadzby',
    amount: 'Suma',
    actions: 'Akcie',
    danger_zone: 'Nebezpečná zóna',
    amount_by_role: 'Suma podľa roly',
    daily_entries: 'Denné záznamy',
    totals_autosave: 'Súčty boli automaticky uložené',
  },
}
