import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TopbarComponent } from '../../shared/components/header/topbar.component';
import { ToastService } from '../../core/services/toast.service';
import {LoginService} from "../../core/services/login.service";
import {models} from "../../../../wailsjs/go/models";
import User = models.User;
import {UserService} from "../../core/services/user.service";

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ ReactiveFormsModule],
  template: `
    <div class="md:ml-64 min-h-screen bg-surface">
<!--      <app-header title="Paramètres"/>-->

      <div class="p-6 md:p-8 max-w-5xl mx-auto w-full">

        <div class="mb-8">
          <h2 class="text-3xl font-extrabold text-on-surface mb-2 font-headline">Paramètres(Admin)</h2>
          <p class="text-on-surface-variant text-sm">Configurez votre profil.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- Nav -->
          <div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm h-fit">
            <div
                class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-b border-slate-100">
              Menu
            </div>
            <div class="p-1.5 flex flex-col gap-0.5">
              @for (item of navItems; track item.label) {
                <button (click)="activeSection = item.key"
                        class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left"
                        [class.bg-blue-50]="activeSection === item.key"
                        [class.text-blue-700]="activeSection === item.key"
                        [class.text-slate-600]="activeSection !== item.key"
                        [class.hover:bg-slate-50]="activeSection !== item.key">
                  <span class="material-symbols-outlined text-[16px]">{{ item.icon }}</span>
                  {{ item.label }}
                </button>
              }
            </div>
          </div>

          <!-- Content -->
          <div class="md:col-span-2 bg-surface-container-lowest rounded-xl p-6 shadow-sm">

            @if (activeSection === 'profile') {
              <div class="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <h3 class="text-base font-semibold text-on-surface">Profil Admin</h3>
                <button (click)="updateAdminProfile()"
                        class="bg-primary hover:bg-primary-dark text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
                  Sauvegarder
                </button>
              </div>

              <!-- Avatar -->
              <div class="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                <div
                    class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">{{ initials(currentUser?.FirstName + " " + currentUser?.LastName) }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-on-surface">{{ currentUser?.FirstName + " " + currentUser?.LastName }}</p>
                </div>
              </div>

              <form [formGroup]="profileForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Prénom</label>
                    <input formControlName="firstName" type="text"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Nom</label>
                    <input formControlName="lastName" type="text"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
                  <input formControlName="email" type="email"
                         class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                </div>
              </form>
            }

            @if (activeSection === 'security') {
              <div class="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <h3 class="text-base font-semibold text-on-surface">Sécurité</h3>
              </div>
              <form [formGroup]="passwordForm">
                <div class="space-y-4">
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Nouveau mot de passe</label>
                    <input formControlName="password" type="password" placeholder="••••••••"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  </div>
                  <button (click)="updateAdminPassword()"
                          class="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
                    Mettre à jour
                  </button>
                </div>
              </form>
            }

            @if (activeSection === 'add_user') {
              <div class="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <h3 class="text-base font-semibold text-on-surface">Nouveau Utilisateur</h3>
              </div>
              <form [formGroup]="userForm" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Prénom</label>
                    <input formControlName="firstName" type="text"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Nom</label>
                    <input formControlName="lastName" type="text"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
                    <input formControlName="email" type="email"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">Nouveau mot de passe</label>
                    <input formControlName="password" type="password" placeholder="••••••••"
                           class="w-full px-3.5 py-2.5 bg-surface-container-highest border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  </div>
                </div>
                <button (click)="createUser()"
                        class="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
                  AJOUTER
                </button>
              </form>
            }

          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  private fb    = inject(FormBuilder);
  private toast = inject(ToastService);
  private loginService = inject(LoginService);
  private userService = inject(UserService);

  activeSection = 'profile';
  currentUser: User | null = null;

  navItems = [
    { key: 'profile',   label: 'Profil Admin',          icon: 'person'     },
    { key: 'security',  label: 'Sécurité',               icon: 'lock'       },
    { key: 'add_user',  label: 'Ajouter un utilisateur', icon: 'person_add' },
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

  ngOnInit() {
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
  }

  initials(name: string | undefined): string {
    return name!.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
  trimFormValues(obj: any): any {
    const trimmed: any = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];

      if (typeof value === 'string') {
        trimmed[key] = value.trim();
      } else {
        trimmed[key] = value;
      }
    });

    return trimmed;
  }
  createUser(): void {
    if (this.userForm.invalid) {
      this.toast.error('Remplissez tous les champs.');
      this.userForm.markAllAsTouched();
      return; }
    const v = this.trimFormValues(this.userForm.value)
    const payload = {
      FirstName: v.firstName,
      LastName:  v.lastName,
      Email:     v.email,
      Password:  v.password,
      Isadmin:   false,
    };
    const user = User.createFrom(payload);
    this.userService.CreateUser(user)
        .then(() => {
          this.toast.success('Utilisateur ajouté avec succés');
          this.userForm.reset();
        })
        .catch(() => this.toast.error("Erreur lors de l'ajout"));
  }

  updateAdminProfile(): void {
    if (this.profileForm.invalid) {
      this.toast.error('Remplissez tous les champs.');
      this.profileForm.markAllAsTouched(); return; }
    const v = this.trimFormValues(this.profileForm.value)
    const payload = {
      ID:        this.currentUser?.ID,
      FirstName: v.firstName,
      LastName:  v.lastName,
      Email:     v.email,
    };
    const user = User.createFrom(payload);
    this.userService.UpdateAdminProfile(user)
        .then((user) =>
        {
          this.loginService.saveUser(user);
          this.toast.success('Mis à jours réussit')
        })
        .catch(() => this.toast.error('Erreur lors du MAJ'));
  }

  updateAdminPassword(): void {
    if (this.passwordForm.invalid) {
      this.toast.error('Remplissez tous les champs.');
      this.passwordForm.markAllAsTouched(); return; }
    const passwd = this.passwordForm.value.password?.trim();
    this.userService.UpdateAdminPassword(this.currentUser!, passwd!)
        .then((user) => {
          this.toast.success('Mis à jours réussit')
        })
        .catch(() => this.toast.error('Erreur lors du MAJ'));
  }
}