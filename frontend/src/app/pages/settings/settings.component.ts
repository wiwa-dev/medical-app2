import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { LoginService } from '../../core/services/login.service';
import { UserService } from '../../core/services/user.service';
import { FinanceService, MedicalService } from '../../core/services/finance.service';
import { models } from '../../../../wailsjs/go/models';
import User = models.User;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <div class="min-h-screen bg-surface">
      <div class="max-w-5xl mx-auto px-4 py-8 md:px-8">

        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            <span class="material-symbols-outlined" style="font-size:14px">home</span>
            <span>Paramètres</span>
          </div>
          <h1 class="text-2xl font-bold text-on-surface">Paramètres</h1>
          <p class="text-sm text-on-surface-variant mt-0.5">Gérez votre profil, la sécurité et la configuration de l'application.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">

          <!-- Sidebar nav -->
          <aside class="h-fit">
            <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              @for (group of navGroups; track group.label) {
                <div class="px-3 pt-4 pb-1">
                  <p class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 px-2 mb-1">{{ group.label }}</p>
                  @for (item of group.items; track item.key) {
                    <button
                      (click)="activeSection = item.key"
                      class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5"
                      [class.bg-primary-container]="activeSection === item.key"
                      [class.text-on-primary-container]="activeSection === item.key"
                      [class.text-on-surface-variant]="activeSection !== item.key"
                      [class.hover:bg-surface-container-high]="activeSection !== item.key">
                      <span class="material-symbols-outlined flex-shrink-0"
                            style="font-size:18px"
                            [class.text-primary]="activeSection === item.key">{{ item.icon }}</span>
                      <span class="truncate">{{ item.label }}</span>
                    </button>
                  }
                </div>
              }
              <div class="h-3"></div>
            </div>
          </aside>

          <!-- Content panel -->
          <main class="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">

            <!-- ── PROFIL ── -->
            @if (activeSection === 'profile') {
              <div class="p-6">
                <div class="flex items-start justify-between mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <h2 class="text-base font-semibold text-on-surface">Profil Admin</h2>
                    <p class="text-xs text-on-surface-variant mt-0.5">Vos informations personnelles.</p>
                  </div>
                  <button (click)="updateAdminProfile()"
                          class="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                    <span class="material-symbols-outlined" style="font-size:15px">save</span>
                    Sauvegarder
                  </button>
                </div>

                <!-- Avatar card -->
                <div class="flex items-center gap-4 p-4 bg-surface-container-high rounded-xl mb-6">
                  <div class="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary text-lg font-bold flex-shrink-0 select-none">
                    {{ initials(currentUser?.FirstName + ' ' + currentUser?.LastName) }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-on-surface">{{ currentUser?.FirstName }} {{ currentUser?.LastName }}</p>
                    <p class="text-xs text-on-surface-variant mt-0.5">{{ currentUser?.Email }}</p>
                    <span class="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <span class="material-symbols-outlined" style="font-size:10px">shield</span>
                      Administrateur
                    </span>
                  </div>
                </div>

                <form [formGroup]="profileForm" class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Prénom</label>
                      <input formControlName="firstName" type="text"
                             class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Nom</label>
                      <input formControlName="lastName" type="text"
                             class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
                    <input formControlName="email" type="email"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                  </div>
                </form>
              </div>
            }

            <!-- ── SÉCURITÉ ── -->
            @if (activeSection === 'security') {
              <div class="p-6">
                <div class="mb-6 pb-5 border-b border-slate-100">
                  <h2 class="text-base font-semibold text-on-surface">Sécurité</h2>
                  <p class="text-xs text-on-surface-variant mt-0.5">Modifiez votre mot de passe d'accès.</p>
                </div>
                <div class="flex items-start gap-3 p-4 bg-blue-50 rounded-xl mb-6">
                  <span class="material-symbols-outlined text-blue-500 flex-shrink-0" style="font-size:20px">info</span>
                  <p class="text-xs text-blue-700 leading-relaxed">
                    Utilisez un mot de passe fort d'au moins 8 caractères, combinant majuscules, chiffres et caractères spéciaux.
                  </p>
                </div>
                <form [formGroup]="passwordForm" class="space-y-4 max-w-sm">
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Nouveau mot de passe</label>
                    <input formControlName="password" type="password" placeholder="••••••••"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                  </div>
                  <button (click)="updateAdminPassword()"
                          class="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined" style="font-size:16px">lock_reset</span>
                    Mettre à jour
                  </button>
                </form>
              </div>
            }

            <!-- ── AJOUTER UTILISATEUR ── -->
            @if (activeSection === 'add_user') {
              <div class="p-6">
                <div class="mb-6 pb-5 border-b border-slate-100">
                  <h2 class="text-base font-semibold text-on-surface">Nouvel Utilisateur</h2>
                  <p class="text-xs text-on-surface-variant mt-0.5">Créez un compte d'accès pour un collaborateur.</p>
                </div>
                <form [formGroup]="userForm" class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Prénom</label>
                      <input formControlName="firstName" type="text"
                             class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Nom</label>
                      <input formControlName="lastName" type="text"
                             class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
                      <input formControlName="email" type="email"
                             class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Mot de passe</label>
                      <input formControlName="password" type="password" placeholder="••••••••"
                             class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                    </div>
                  </div>
                  <button (click)="createUser()"
                          class="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
                    <span class="material-symbols-outlined" style="font-size:16px">person_add</span>
                    Créer l'utilisateur
                  </button>
                </form>
              </div>
            }

            <!-- ── SERVICES ── -->
            @if (activeSection === 'services') {
              <div class="p-6">
                <div class="flex items-start justify-between mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <h2 class="text-base font-semibold text-on-surface">Gestion des Services</h2>
                    <p class="text-xs text-on-surface-variant mt-0.5">
                      Ajoutez ou désactivez des services. Les modifications sont appliquées immédiatement à la saisie.
                    </p>
                  </div>
                </div>

                <!-- Add service form -->
                <div class="bg-surface-container-high rounded-xl p-4 mb-6">
                  <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Nouveau service</p>
                  <form [formGroup]="serviceForm" class="space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">
                          Nom interne <span class="text-error">*</span>
                        </label>
                        <input formControlName="name" type="text" placeholder="ex: Radiologie"
                               class="w-full px-3 py-2 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                        <p class="text-[10px] text-on-surface-variant mt-1">Identifiant unique, sans espaces.</p>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">
                          Libellé complet <span class="text-error">*</span>
                        </label>
                        <input formControlName="label" type="text" placeholder="ex: Radiologie médicale"
                               class="w-full px-3 py-2 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                      </div>
                      <div>
                        <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">
                          Libellé court <span class="text-error">*</span>
                        </label>
                        <input formControlName="shortLabel" type="text" placeholder="ex: Radio"
                               class="w-full px-3 py-2 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25 transition-all">
                        <p class="text-[10px] text-on-surface-variant mt-1">Affiché dans le tableau de saisie.</p>
                      </div>
                    </div>
                    <button (click)="addService()" [disabled]="serviceForm.invalid || savingService"
                            class="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
                      <span class="material-symbols-outlined" style="font-size:16px">add</span>
                      {{ savingService ? 'Ajout...' : 'Ajouter le service' }}
                    </button>
                  </form>
                </div>

                <!-- Services list -->
                @if (servicesLoading) {
                  <div class="flex items-center justify-center py-8 gap-2 text-on-surface-variant">
                    <span class="material-symbols-outlined" style="font-size:20px;opacity:0.5">progress_activity</span>
                    <span class="text-sm">Chargement…</span>
                  </div>
                } @else if (services.length === 0) {
                  <div class="flex flex-col items-center justify-center py-10 gap-2 text-on-surface-variant">
                    <span class="material-symbols-outlined" style="font-size:40px;opacity:0.3">medical_services</span>
                    <p class="text-sm">Aucun service actif.</p>
                  </div>
                } @else {
                  <div class="divide-y divide-slate-100">
                    @for (svc of services; track svc.ID) {
                      <div class="flex items-center gap-3 py-3">
                        <!-- Drag handle (visual) -->
                        <span class="material-symbols-outlined text-on-surface-variant/30 flex-shrink-0" style="font-size:18px">drag_indicator</span>

                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                          @if (editingId === svc.ID) {
                            <!-- Inline edit -->
                            <div class="grid grid-cols-3 gap-2">
                              <input [(ngModel)]="editBuffer.label" type="text" placeholder="Libellé"
                                     class="px-2.5 py-1.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25">
                              <input [(ngModel)]="editBuffer.shortLabel" type="text" placeholder="Court"
                                     class="px-2.5 py-1.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25">
                              <input [(ngModel)]="editBuffer.sortOrder" type="number" min="1" placeholder="Ordre"
                                     class="px-2.5 py-1.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25">
                            </div>
                          } @else {
                            <div class="flex items-center gap-2">
                              <p class="text-sm font-semibold text-on-surface truncate">{{ svc.Label }}</p>
                              <span class="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">{{ svc.ShortLabel }}</span>
                              <span class="text-[10px] text-on-surface-variant/50">#{{ svc.SortOrder }}</span>
                            </div>
                            <p class="text-xs text-on-surface-variant mt-0.5 font-mono">{{ svc.Name }}</p>
                          }
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center gap-1 flex-shrink-0">
                          @if (editingId === svc.ID) {
                            <button (click)="saveEdit(svc)"
                                    class="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                              <span class="material-symbols-outlined" style="font-size:18px">check</span>
                            </button>
                            <button (click)="cancelEdit()"
                                    class="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
                              <span class="material-symbols-outlined" style="font-size:18px">close</span>
                            </button>
                          } @else {
                            <button (click)="startEdit(svc)"
                                    class="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
                              <span class="material-symbols-outlined" style="font-size:16px">edit</span>
                            </button>
                            <button (click)="removeService(svc)"
                                    class="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors">
                              <span class="material-symbols-outlined" style="font-size:16px">delete</span>
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Info note -->
                <div class="mt-6 flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                  <span class="material-symbols-outlined text-amber-500 flex-shrink-0" style="font-size:18px">info</span>
                  <p class="text-xs text-amber-700 leading-relaxed">
                    La désactivation d'un service ne supprime pas les données historiques. Les montants déjà saisis pour ce service restent dans les rapports.
                  </p>
                </div>
              </div>
            }

          </main>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private toast          = inject(ToastService);
  private loginService   = inject(LoginService);
  private userService    = inject(UserService);
  private financeService = inject(FinanceService);

  activeSection = 'profile';
  currentUser: User | null = null;

  // Services state
  services: MedicalService[] = [];
  servicesLoading = false;
  savingService = false;
  editingId: number | null = null;
  editBuffer = { label: '', shortLabel: '', sortOrder: 0 };

  navGroups = [
    {
      label: 'Compte',
      items: [
        { key: 'profile',   label: 'Profil Admin',        icon: 'person'          },
        { key: 'security',  label: 'Sécurité',            icon: 'lock'            },
        { key: 'add_user',  label: 'Ajouter utilisateur', icon: 'person_add'      },
      ],
    },
    {
      label: 'Application',
      items: [
        { key: 'services',  label: 'Services',            icon: 'medical_services' },
      ],
    },
  ];

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', Validators.required],
  });

  userForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', Validators.required],
    password:  ['', Validators.required],
  });

  passwordForm = this.fb.group({
    password: ['', Validators.required],
  });

  serviceForm = this.fb.group({
    name:       ['', Validators.required],
    label:      ['', Validators.required],
    shortLabel: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loginService.currentUser.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          firstName: user.FirstName,
          lastName:  user.LastName,
          email:     user.Email,
        });
      }
    });
    this.loadServices();
  }

  // ── Services ────────────────────────────────────────────────

  async loadServices(): Promise<void> {
    this.servicesLoading = true;
    try {
      this.services = await this.financeService.getServices();
    } catch {
      this.toast.error('Erreur chargement des services');
    } finally {
      this.servicesLoading = false;
    }
  }

  async addService(): Promise<void> {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    this.savingService = true;
    const v = this.serviceForm.value;
    try {
      const created = await this.financeService.createService({
        Name:       v.name!.trim(),
        Label:      v.label!.trim(),
        ShortLabel: v.shortLabel!.trim(),
        Active:     true,
        SortOrder:  0,
      } as any);
      this.services.push(created);
      this.serviceForm.reset();
      this.toast.success(`Service "${created.Label}" ajouté`);
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    } finally {
      this.savingService = false;
    }
  }

  startEdit(svc: MedicalService): void {
    this.editingId = svc.ID;
    this.editBuffer = { label: svc.Label, shortLabel: svc.ShortLabel, sortOrder: svc.SortOrder };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  async saveEdit(svc: MedicalService): Promise<void> {
    try {
      const updated = await this.financeService.updateService(
        models.MedicalService.createFrom({
          ...svc,
          Label:      this.editBuffer.label.trim(),
          ShortLabel: this.editBuffer.shortLabel.trim(),
          SortOrder:  this.editBuffer.sortOrder,
        })
      );
      const idx = this.services.findIndex(s => s.ID === svc.ID);
      if (idx !== -1) this.services[idx] = updated;
      this.editingId = null;
      this.toast.success('Service mis à jour');
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }

  async removeService(svc: MedicalService): Promise<void> {
    try {
      await this.financeService.deleteService(svc.ID);
      this.services = this.services.filter(s => s.ID !== svc.ID);
      this.toast.success(`Service "${svc.Label}" désactivé`);
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }

  // ── Profile / User / Password ───────────────────────────────

  initials(name: string | undefined): string {
    if (!name?.trim()) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  private trimFormValues(obj: any): any {
    const result: any = {};
    Object.keys(obj).forEach(key => {
      result[key] = typeof obj[key] === 'string' ? obj[key].trim() : obj[key];
    });
    return result;
  }

  createUser(): void {
    if (this.userForm.invalid) {
      this.toast.error('Remplissez tous les champs.');
      this.userForm.markAllAsTouched();
      return;
    }
    const v = this.trimFormValues(this.userForm.value);
    this.userService.CreateUser(User.createFrom({
      FirstName: v.firstName,
      LastName:  v.lastName,
      Email:     v.email,
      Password:  v.password,
      Isadmin:   false,
    }))
      .then(() => {
        this.toast.success('Utilisateur ajouté avec succès');
        this.userForm.reset();
      })
      .catch(() => this.toast.error("Erreur lors de l'ajout"));
  }

  updateAdminProfile(): void {
    if (this.profileForm.invalid) {
      this.toast.error('Remplissez tous les champs.');
      this.profileForm.markAllAsTouched();
      return;
    }
    const v = this.trimFormValues(this.profileForm.value);
    this.userService.UpdateAdminProfile(User.createFrom({
      ID:        this.currentUser?.ID,
      FirstName: v.firstName,
      LastName:  v.lastName,
      Email:     v.email,
    }))
      .then((user) => {
        this.loginService.saveUser(user);
        this.toast.success('Profil mis à jour');
      })
      .catch(() => this.toast.error('Erreur lors de la mise à jour'));
  }

  updateAdminPassword(): void {
    if (this.passwordForm.invalid) {
      this.toast.error('Remplissez tous les champs.');
      this.passwordForm.markAllAsTouched();
      return;
    }
    const passwd = this.passwordForm.value.password?.trim();
    this.userService.UpdateAdminPassword(this.currentUser!, passwd!)
      .then(() => this.toast.success('Mot de passe mis à jour'))
      .catch(() => this.toast.error('Erreur lors de la mise à jour'));
  }
}
