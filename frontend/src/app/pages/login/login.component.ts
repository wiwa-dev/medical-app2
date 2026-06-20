// login.component.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import {ToastComponent} from "../../shared/components/toast/toast.component";
import {LoginService} from "../../core/services/login.service";

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass, ToastComponent],
    template: `
    <div class="min-h-screen bg-[#001535] flex items-center justify-center p-6">

      <div class="w-full max-w-[840px] grid md:grid-cols-2 bg-surface-container-lowest rounded-[20px] overflow-hidden shadow-lg border border-slate-100">

        <!-- ── Colonne gauche : formulaire ── -->
        <div class="p-10 flex flex-col justify-center">

          <!-- Logo -->
          <div class="flex items-center gap-2.5 mb-10">
              <img src="assets/appicon.png" alt="CAREX logo" class="w-16 h-16 rounded-xl object-contain flex-shrink-0">
            <span class="font-headline font-extrabold text-[17px] text-on-surface tracking-tight">
              <span class="text-blue-600">FinCare~</span>X
            </span>
          </div>

          <!-- Titre -->
          <h1 class="font-headline font-extrabold text-[26px] text-on-surface mb-1 tracking-tight">Bienvenue</h1>
          <p class="text-sm text-on-surface-variant mb-8">Connectez-vous à votre espace sécurisé</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" id="login-form">

            <!-- Identifiant -->
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Email
              </label>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4 pointer-events-none"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input formControlName="identifier" type="email"
                       name="email"
                       autocomplete="email"
                  [ngClass]="fe('identifier') ? 'ring-2 ring-error/40' : ''"
                  class="w-full h-12 pl-10 pr-4 bg-surface-container-highest border-none rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-outline"
                  placeholder="dr.nom@cabinet.sn" />
              </div>
              @if (fe('identifier')) {
                <p class="text-xs text-error mt-1 ml-1">L'identifiant est obligatoire.</p>
              }
            </div>

            <!-- Mot de passe -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-xs font-semibold text-on-surface-variant">Mot de passe</label>
                <button (click)="forgetPass()" type="button" class="text-xs text-primary font-semibold hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>
              <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4 pointer-events-none"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input formControlName="password" [type]="showPassword ? 'text' : 'password'"
                  [ngClass]="fe('password') ? 'ring-2 ring-error/40' : ''"
                  class="w-full h-12 pl-10 pr-10 bg-surface-container-highest border-none rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-outline"
                  placeholder="••••••••" />
                <!-- Toggle visibilité -->
                <button type="button" (click)="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
                  @if (showPassword) {
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  }
                </button>
              </div>
              @if (fe('password')) {
                <p class="text-xs text-error mt-1 ml-1">Le mot de passe est obligatoire.</p>
              }
            </div>

            <!-- Bouton -->
            <button type="submit" [disabled]="form.invalid || loading"
              class="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[.98] shadow-sm mt-2">
              @if (loading) {
                <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Connexion…
              } @else {
                <span>Se connecter</span>
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                </svg>
              }
            </button>

          </form>

          <!-- Footer -->
          <div class="mt-10 pt-6 border-t border-surface-container flex justify-between items-center">
            <span class="text-[10px] text-blue-600 font-bold tracking-widest uppercase ">FinCare~X v1.0</span>
            <div class="flex gap-3">
              <svg class="w-4 h-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <svg class="w-4 h-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- ── Colonne droite : visuel ── -->
          <!-- ── Colonne droite : illustration ── -->
          <div class="hidden md:flex items-center justify-center bg-[#EFF6FF] relative overflow-hidden rounded-r-[20px]">

              <svg width="100%" viewBox="0 0 690 790" role="img" xmlns="http://www.w3.org/2000/svg" style="">
                  <desc style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">Un médecin en blouse blanche assis à son bureau consulte un écran, entouré de dossiers patients et documents officiels flottants</desc>
                  <defs>

                  </defs>

                  <!-- ── fond dégradé plat bleu très clair ── -->
                  <rect width="680" height="780" fill="#EFF6FF" rx="20" style="fill:rgb(239, 246, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="0" y="480" width="680" height="300" fill="#DBEAFE" rx="0" style="fill:rgb(219, 234, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="0" y="460" width="680" height="30" fill="#BFDBFE" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- ── sol / plan de travail ── -->
                  <rect x="80" y="480" width="520" height="16" rx="4" fill="#93C5FD" style="fill:rgb(147, 197, 253);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="100" y="496" width="480" height="220" rx="8" fill="#1E3A5F" opacity="0.06" style="fill:rgb(30, 58, 95);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.06;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- ─────────────────────────────────────────
                       BUREAU
                  ──────────────────────────────────────────── -->
                  <rect x="120" y="390" width="440" height="100" rx="6" fill="#1E40AF" opacity="0.12" style="fill:rgb(30, 64, 175);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.12;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="120" y="390" width="440" height="14" rx="4" fill="#3B82F6" opacity="0.35" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.35;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- pieds du bureau -->
                  <rect x="148" y="490" width="18" height="80" rx="4" fill="#93C5FD" style="fill:rgb(147, 197, 253);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="514" y="490" width="18" height="80" rx="4" fill="#93C5FD" style="fill:rgb(147, 197, 253);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- ─────────────────────────────────────────
                       ÉCRAN / ORDINATEUR
                  ──────────────────────────────────────────── -->
                  <rect x="230" y="210" width="220" height="165" rx="8" fill="#1E3A5F" style="fill:rgb(30, 58, 95);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="237" y="217" width="206" height="148" rx="5" fill="#F8FAFF" style="fill:rgb(248, 250, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- contenu écran : dossier patient -->
                  <rect x="244" y="224" width="192" height="22" rx="3" fill="#3B82F6" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="249" y="228" width="80" height="10" rx="2" fill="white" opacity="0.85" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.85;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="244" y="252" width="90" height="8" rx="2" fill="#BFDBFE" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="244" y="265" width="130" height="6" rx="2" fill="#DBEAFE" style="fill:rgb(219, 234, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="244" y="276" width="110" height="6" rx="2" fill="#DBEAFE" style="fill:rgb(219, 234, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="244" y="287" width="140" height="6" rx="2" fill="#DBEAFE" style="fill:rgb(219, 234, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="244" y="300" width="80" height="14" rx="3" fill="#22C55E" opacity="0.8" style="fill:rgb(34, 197, 94);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.8;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="244" y="319" width="192" height="1" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- mini graphe barres -->
                  <rect x="248" y="330" width="14" height="22" rx="2" fill="#3B82F6" opacity="0.6" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.6;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="266" y="320" width="14" height="32" rx="2" fill="#3B82F6" opacity="0.8" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.8;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="284" y="325" width="14" height="27" rx="2" fill="#3B82F6" opacity="0.7" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="302" y="315" width="14" height="37" rx="2" fill="#3B82F6" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="320" y="322" width="14" height="30" rx="2" fill="#3B82F6" opacity="0.65" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.65;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- curseur clignotant -->
                  <rect x="339" y="328" width="2" height="16" rx="1" fill="#3B82F6" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- pied écran -->
                  <rect x="320" y="375" width="40" height="8" rx="2" fill="#475569" style="fill:rgb(71, 85, 105);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="300" y="383" width="80" height="10" rx="3" fill="#475569" style="fill:rgb(71, 85, 105);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- ─────────────────────────────────────────
                       MÉDECIN (silhouette stylisée)
                  ──────────────────────────────────────────── -->
                  <!-- chaise -->
                  <rect x="295" y="420" width="90" height="12" rx="4" fill="#93C5FD" style="fill:rgb(147, 197, 253);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="330" y="432" width="20" height="50" rx="3" fill="#93C5FD" style="fill:rgb(147, 197, 253);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- corps blouse blanche -->
                  <rect x="282" y="318" width="116" height="110" rx="28" fill="white" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="282" y="318" width="116" height="40" rx="20" fill="#E0EAFF" style="fill:rgb(224, 234, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- col & cravate -->
                  <polygon points="340,318 328,340 340,334 352,340" fill="#1E40AF" opacity="0.7" style="fill:rgb(30, 64, 175);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- stéthoscope autour du cou -->
                  <path d="M320 338 C308 360 302 375 312 382 C322 389 330 380 330 368" fill="none" stroke="#374151" stroke-width="3" stroke-linecap="round" style="fill:none;stroke:rgb(55, 65, 81);color:rgb(255, 255, 255);stroke-width:3px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="312" cy="383" r="5" fill="#374151" style="fill:rgb(55, 65, 81);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- bras gauche (vers clavier) -->
                  <path d="M284 360 C268 375 258 390 268 398" fill="none" stroke="white" stroke-width="22" stroke-linecap="round" style="fill:none;stroke:rgb(255, 255, 255);color:rgb(255, 255, 255);stroke-width:22px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <path d="M284 360 C268 375 258 390 268 398" fill="none" stroke="#E0EAFF" stroke-width="18" stroke-linecap="round" style="fill:none;stroke:rgb(224, 234, 255);color:rgb(255, 255, 255);stroke-width:18px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- main gauche -->
                  <ellipse cx="268" cy="400" rx="14" ry="9" fill="#F9D4BE" style="fill:rgb(249, 212, 190);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- bras droit (stylo) -->
                  <path d="M396 360 C410 375 418 390 410 400" fill="none" stroke="white" stroke-width="22" stroke-linecap="round" style="fill:none;stroke:rgb(255, 255, 255);color:rgb(255, 255, 255);stroke-width:22px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <path d="M396 360 C410 375 418 390 410 400" fill="none" stroke="#E0EAFF" stroke-width="18" stroke-linecap="round" style="fill:none;stroke:rgb(224, 234, 255);color:rgb(255, 255, 255);stroke-width:18px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- main droite + stylo -->
                  <ellipse cx="410" cy="401" rx="13" ry="8" fill="#F9D4BE" style="fill:rgb(249, 212, 190);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="416" y="385" width="4" height="28" rx="2" fill="#1E40AF" transform="rotate(-20 416 385)" style="fill:rgb(30, 64, 175);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- tête -->
                  <circle cx="340" cy="285" r="36" fill="#F9D4BE" style="fill:rgb(249, 212, 190);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- cheveux -->
                  <ellipse cx="340" cy="258" rx="36" ry="16" fill="#1E293B" style="fill:rgb(30, 41, 59);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <ellipse cx="317" cy="268" rx="10" ry="18" fill="#1E293B" style="fill:rgb(30, 41, 59);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <ellipse cx="363" cy="268" rx="10" ry="18" fill="#1E293B" style="fill:rgb(30, 41, 59);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- oreilles -->
                  <ellipse cx="304" cy="288" rx="6" ry="9" fill="#F9D4BE" style="fill:rgb(249, 212, 190);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <ellipse cx="376" cy="288" rx="6" ry="9" fill="#F9D4BE" style="fill:rgb(249, 212, 190);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- yeux -->
                  <ellipse cx="328" cy="285" rx="5" ry="6" fill="white" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <ellipse cx="352" cy="285" rx="5" ry="6" fill="white" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="329" cy="286" r="3" fill="#1E293B" style="fill:rgb(30, 41, 59);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="353" cy="286" r="3" fill="#1E293B" style="fill:rgb(30, 41, 59);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="330" cy="285" r="1" fill="white" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="354" cy="285" r="1" fill="white" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- sourcils -->
                  <path d="M322 277 C326 274 332 274 336 276" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" style="fill:none;stroke:rgb(30, 41, 59);color:rgb(255, 255, 255);stroke-width:2.5px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <path d="M346 276 C350 274 356 274 360 277" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" style="fill:none;stroke:rgb(30, 41, 59);color:rgb(255, 255, 255);stroke-width:2.5px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- bouche sourire -->
                  <path d="M332 298 C336 303 344 303 348 298" fill="none" stroke="#C87B5A" stroke-width="2" stroke-linecap="round" style="fill:none;stroke:rgb(200, 123, 90);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <!-- lunettes -->
                  <rect x="319" y="280" width="18" height="13" rx="5" fill="none" stroke="#374151" stroke-width="1.8" style="fill:none;stroke:rgb(55, 65, 81);color:rgb(255, 255, 255);stroke-width:1.8px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="343" y="280" width="18" height="13" rx="5" fill="none" stroke="#374151" stroke-width="1.8" style="fill:none;stroke:rgb(55, 65, 81);color:rgb(255, 255, 255);stroke-width:1.8px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <line x1="337" y1="286" x2="343" y2="286" stroke="#374151" stroke-width="1.5" style="fill:rgb(0, 0, 0);stroke:rgb(55, 65, 81);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <line x1="319" y1="286" x2="313" y2="285" stroke="#374151" stroke-width="1.5" style="fill:rgb(0, 0, 0);stroke:rgb(55, 65, 81);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <line x1="361" y1="286" x2="367" y2="285" stroke="#374151" stroke-width="1.5" style="fill:rgb(0, 0, 0);stroke:rgb(55, 65, 81);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- badge badge fonctionnaire -->
                  <rect x="350" y="340" width="38" height="24" rx="4" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.2" style="fill:rgb(239, 246, 255);stroke:rgb(59, 130, 246);color:rgb(255, 255, 255);stroke-width:1.2px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="354" y="344" width="18" height="4" rx="1" fill="#3B82F6" opacity="0.7" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="354" y="352" width="24" height="3" rx="1" fill="#BFDBFE" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="354" y="358" width="20" height="3" rx="1" fill="#BFDBFE" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- ─────────────────────────────────────────
                       DOCUMENT FLOTTANT 1 — Certificat médical
                  ──────────────────────────────────────────── -->
                  <g transform="translate(440, 200)" style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
                      <rect x="0" y="0" width="140" height="170" rx="8" fill="white" stroke="#BFDBFE" stroke-width="1.5" style="fill:rgb(255, 255, 255);stroke:rgb(191, 219, 254);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="0" y="0" width="140" height="28" rx="8" fill="#3B82F6" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="0" y="20" width="140" height="8" fill="#3B82F6" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="10" y="6" width="70" height="8" rx="2" fill="white" opacity="0.9" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.9;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="10" y="6" width="14" height="14" rx="3" fill="white" opacity="0.2" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.2;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- contenu lignes -->
                      <rect x="12" y="38" width="60" height="6" rx="2" fill="#BFDBFE" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="50" width="116" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="60" width="100" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="70" width="110" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="80" width="90" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="96" width="116" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="106" width="80" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="116" width="95" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- tampon rond -->
                      <circle cx="98" cy="148" r="18" fill="none" stroke="#3B82F6" stroke-width="1.5" opacity="0.5" style="fill:none;stroke:rgb(59, 130, 246);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.5;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <circle cx="98" cy="148" r="13" fill="none" stroke="#3B82F6" stroke-width="1" opacity="0.4" style="fill:none;stroke:rgb(59, 130, 246);color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.4;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="88" y="145" width="20" height="4" rx="1" fill="#3B82F6" opacity="0.4" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.4;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="90" y="138" width="16" height="3" rx="1" fill="#3B82F6" opacity="0.3" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.3;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- signature -->
                      <path d="M18 148 C24 143 30 153 38 148 C44 143 48 150 55 148" fill="none" stroke="#374151" stroke-width="1.5" stroke-linecap="round" style="fill:none;stroke:rgb(55, 65, 81);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  </g>

                  <!-- ─────────────────────────────────────────
                       DOCUMENT FLOTTANT 2 — Dossier patient
                  ──────────────────────────────────────────── -->
                  <g transform="translate(98, 150)" style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
                      <rect x="0" y="0" width="130" height="185" rx="8" fill="white" stroke="#BFDBFE" stroke-width="1.5" style="fill:rgb(255, 255, 255);stroke:rgb(191, 219, 254);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="0" y="0" width="130" height="30" rx="8" fill="#0F6E56" style="fill:rgb(15, 110, 86);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="0" y="22" width="130" height="8" fill="#0F6E56" style="fill:rgb(15, 110, 86);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="10" y="8" width="60" height="7" rx="2" fill="white" opacity="0.85" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.85;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- avatar patient -->
                      <circle cx="30" cy="60" r="16" fill="#DBEAFE" style="fill:rgb(219, 234, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <circle cx="30" cy="55" r="8" fill="#93C5FD" style="fill:rgb(147, 197, 253);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <ellipse cx="30" cy="70" rx="12" ry="8" fill="#93C5FD" style="fill:rgb(147, 197, 253);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- infos patient -->
                      <rect x="54" y="48" width="64" height="6" rx="2" fill="#1D9E75" style="fill:rgb(29, 158, 117);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="54" y="58" width="50" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="54" y="67" width="56" height="5" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- séparateur -->
                      <rect x="12" y="85" width="106" height="1" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- historique lignes -->
                      <rect x="12" y="94" width="50" height="5" rx="2" fill="#BFDBFE" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="104" width="106" height="4" rx="2" fill="#F1F5F9" style="fill:rgb(241, 245, 249);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="113" width="90" height="4" rx="2" fill="#F1F5F9" style="fill:rgb(241, 245, 249);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="122" width="100" height="4" rx="2" fill="#F1F5F9" style="fill:rgb(241, 245, 249);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="12" y="131" width="70" height="4" rx="2" fill="#F1F5F9" style="fill:rgb(241, 245, 249);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- statut badge -->
                      <rect x="12" y="148" width="52" height="18" rx="9" fill="#DCFCE7" style="fill:rgb(220, 252, 231);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <circle cx="26" cy="157" r="4" fill="#22C55E" style="fill:rgb(34, 197, 94);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="34" y="153" width="24" height="8" rx="2" fill="#16A34A" opacity="0.6" style="fill:rgb(22, 163, 74);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.6;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- petite croix sécu -->
                      <rect x="100" y="148" width="18" height="18" rx="4" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1" style="fill:rgb(239, 246, 255);stroke:rgb(191, 219, 254);color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="107" y="151" width="4" height="12" rx="1" fill="#3B82F6" opacity="0.7" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="103" y="155" width="12" height="4" rx="1" fill="#3B82F6" opacity="0.7" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  </g>

                  <!-- ─────────────────────────────────────────
                       DOCUMENT FLOTTANT 3 — Décision admin
                  ──────────────────────────────────────────── -->
                  <g transform="translate(480, 390)" style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
                      <rect x="0" y="0" width="125" height="155" rx="8" fill="white" stroke="#FDE68A" stroke-width="1.5" style="fill:rgb(255, 255, 255);stroke:rgb(253, 230, 138);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="0" y="0" width="125" height="26" rx="8" fill="#B45309" style="fill:rgb(180, 83, 9);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="0" y="18" width="125" height="8" fill="#B45309" style="fill:rgb(180, 83, 9);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="10" y="6" width="65" height="7" rx="2" fill="white" opacity="0.85" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.85;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- entête République -->
                      <rect x="10" y="36" width="105" height="4" rx="2" fill="#FDE68A" style="fill:rgb(253, 230, 138);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="28" y="44" width="70" height="3" rx="2" fill="#FEF3C7" style="fill:rgb(254, 243, 199);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- corps décision -->
                      <rect x="10" y="56" width="105" height="4" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="10" y="65" width="90" height="4" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="10" y="74" width="100" height="4" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="10" y="83" width="80" height="4" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="10" y="92" width="95" height="4" rx="2" fill="#E2E8F0" style="fill:rgb(226, 232, 240);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- sceau République -->
                      <circle cx="40" cy="130" r="16" fill="#FEF3C7" stroke="#B45309" stroke-width="1.2" style="fill:rgb(254, 243, 199);stroke:rgb(180, 83, 9);color:rgb(255, 255, 255);stroke-width:1.2px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <circle cx="40" cy="130" r="10" fill="none" stroke="#B45309" stroke-width="1" opacity="0.6" style="fill:none;stroke:rgb(180, 83, 9);color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.6;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="34" y="127" width="12" height="3" rx="1" fill="#B45309" opacity="0.5" style="fill:rgb(180, 83, 9);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.5;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="36" y="122" width="8" height="2" rx="1" fill="#B45309" opacity="0.4" style="fill:rgb(180, 83, 9);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.4;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <!-- signature -->
                      <path d="M65 128 C70 124 76 133 83 128 C88 124 92 131 98 128" fill="none" stroke="#374151" stroke-width="1.5" stroke-linecap="round" style="fill:none;stroke:rgb(55, 65, 81);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  </g>

                  <!-- ─────────────────────────────────────────
                       CLASSEURS / pile de dossiers sur le bureau
                  ──────────────────────────────────────────── -->
                  <rect x="148" y="348" width="32" height="52" rx="3" fill="#3B82F6" style="fill:rgb(59, 130, 246);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="152" y="344" width="32" height="52" rx="3" fill="#1D4ED8" style="fill:rgb(29, 78, 216);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="156" y="340" width="32" height="52" rx="3" fill="#2563EB" style="fill:rgb(37, 99, 235);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="160" y="352" width="20" height="6" rx="1" fill="white" opacity="0.6" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.6;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="162" y="362" width="14" height="3" rx="1" fill="white" opacity="0.4" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.4;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <rect x="498" y="350" width="32" height="44" rx="3" fill="#0F6E56" style="fill:rgb(15, 110, 86);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="502" y="346" width="32" height="44" rx="3" fill="#1D9E75" style="fill:rgb(29, 158, 117);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="506" y="358" width="20" height="5" rx="1" fill="white" opacity="0.6" style="fill:rgb(255, 255, 255);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.6;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- tasse café -->
                  <rect x="200" y="372" width="30" height="24" rx="4" fill="white" stroke="#E2E8F0" stroke-width="1" style="fill:rgb(255, 255, 255);stroke:rgb(226, 232, 240);color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <rect x="203" y="375" width="24" height="14" rx="2" fill="#7C3AED" opacity="0.15" style="fill:rgb(124, 58, 237);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.15;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <path d="M230 377 C238 377 238 388 230 388" fill="none" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round" style="fill:none;stroke:rgb(226, 232, 240);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <path d="M207 370 C208 362 212 358 211 352" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" opacity="0.6" style="fill:none;stroke:rgb(148, 163, 184);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:miter;opacity:0.6;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <path d="M214 368 C215 360 219 356 218 350" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" opacity="0.4" style="fill:none;stroke:rgb(148, 163, 184);color:rgb(255, 255, 255);stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:miter;opacity:0.4;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- ─────────────────────────────────────────
                       ÉLÉMENTS UI flottants (notifications)
                  ──────────────────────────────────────────── -->
                  <g transform="translate(460, 120)" style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
                      <rect x="0" y="0" width="150" height="52" rx="10" fill="white" stroke="#BFDBFE" stroke-width="1" style="fill:rgb(255, 255, 255);stroke:rgb(191, 219, 254);color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <circle cx="22" cy="26" r="12" fill="#DCFCE7" style="fill:rgb(220, 252, 231);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <path d="M16 26 L20 30 L28 22" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="fill:none;stroke:rgb(22, 163, 74);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:round;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="40" y="13" width="90" height="7" rx="2" fill="#374151" opacity="0.7" style="fill:rgb(55, 65, 81);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="40" y="25" width="70" height="5" rx="2" fill="#94A3B8" style="fill:rgb(148, 163, 184);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="40" y="35" width="50" height="5" rx="2" fill="#BFDBFE" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  </g>

                  <g transform="translate(76, 370)" style="fill:rgb(0, 0, 0);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto">
                      <rect x="0" y="0" width="136" height="50" rx="10" fill="white" stroke="#FDE68A" stroke-width="1" style="fill:rgb(255, 255, 255);stroke:rgb(253, 230, 138);color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <circle cx="20" cy="25" r="11" fill="#FEF3C7" style="fill:rgb(254, 243, 199);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="16" y="21" width="8" height="3" rx="1" fill="#B45309" opacity="0.7" style="fill:rgb(180, 83, 9);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="18" y="16" width="4" height="3" rx="1" fill="#B45309" opacity="0.6" style="fill:rgb(180, 83, 9);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.6;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <circle cx="20" cy="29" r="2" fill="#B45309" opacity="0.7" style="fill:rgb(180, 83, 9);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="38" y="12" width="80" height="7" rx="2" fill="#374151" opacity="0.7" style="fill:rgb(55, 65, 81);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.7;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="38" y="24" width="60" height="5" rx="2" fill="#94A3B8" style="fill:rgb(148, 163, 184);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                      <rect x="38" y="33" width="72" height="5" rx="2" fill="#FDE68A" opacity="0.8" style="fill:rgb(253, 230, 138);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.8;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  </g>

                  <!-- ─────────────────────────────────────────
                       DÉCORS / particules arrière-plan
                  ──────────────────────────────────────────── -->
                  <circle cx="80" cy="120" r="22" fill="#BFDBFE" opacity="0.35" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.35;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="610" cy="320" r="30" fill="#D1FAE5" opacity="0.4" style="fill:rgb(209, 250, 229);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.4;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="580" cy="80" r="16" fill="#FDE68A" opacity="0.35" style="fill:rgb(253, 230, 138);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.35;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="120" cy="480" r="40" fill="#BFDBFE" opacity="0.25" style="fill:rgb(191, 219, 254);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.25;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- petites croix décoratives -->
                  <line x1="70" y1="240" x2="70" y2="252" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" style="fill:rgb(0, 0, 0);stroke:rgb(147, 197, 253);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <line x1="64" y1="246" x2="76" y2="246" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" style="fill:rgb(0, 0, 0);stroke:rgb(147, 197, 253);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <line x1="618" y1="180" x2="618" y2="192" stroke="#FCD34D" stroke-width="2" stroke-linecap="round" style="fill:rgb(0, 0, 0);stroke:rgb(252, 211, 77);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <line x1="612" y1="186" x2="624" y2="186" stroke="#FCD34D" stroke-width="2" stroke-linecap="round" style="fill:rgb(0, 0, 0);stroke:rgb(252, 211, 77);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <line x1="600" y1="440" x2="600" y2="450" stroke="#6EE7B7" stroke-width="2" stroke-linecap="round" style="fill:rgb(0, 0, 0);stroke:rgb(110, 231, 183);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <line x1="595" y1="445" x2="605" y2="445" stroke="#6EE7B7" stroke-width="2" stroke-linecap="round" style="fill:rgb(0, 0, 0);stroke:rgb(110, 231, 183);color:rgb(255, 255, 255);stroke-width:2px;stroke-linecap:round;stroke-linejoin:miter;opacity:1;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>

                  <!-- points flottants -->
                  <circle cx="178" cy="230" r="4" fill="#93C5FD" style="fill:rgb(147, 197, 253);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.73433;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="502" cy="288" r="4" fill="#6EE7B7" style="fill:rgb(110, 231, 183);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.73433;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
                  <circle cx="440" cy="470" r="3" fill="#FCD34D" style="fill:rgb(252, 211, 77);stroke:none;color:rgb(255, 255, 255);stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;opacity:0.73433;font-family,&quot;Anthropic Sans&quot;, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, sans-serif;font-size:16px;font-weight:400;text-anchor:start;dominant-baseline:auto"/>
              </svg>
          </div>

      </div>
    </div>
    <app-toast />
  `,

})
export class LoginComponent {
    private fb     = inject(FormBuilder);
    private router = inject(Router);
    private toast  = inject(ToastService);
    private loginService = inject(LoginService);

    loading      = false;
    showPassword = false;

    form = this.fb.group({
        identifier: ['', Validators.required],
        password:   ['', Validators.required],
    });
    ngOnInit(){

    }
    fe(field: string): boolean {
        const c = this.form.get(field);
        return !!(c?.invalid && c?.touched);
    }

    forgetPass(){
        this.toast.warning("Veuiller contacter l'Admin ou le Support")
    }

    submit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.loading = true;
        const email = this.form.value.identifier as string;
        const password = this.form.value.password as string;
        // ── Remplacer par ton appel Wails ──
        // ex: LoginUser(identifier, password).then(...)
        this.loginService.loginUser(email, password)
            .then((user) => {
            this.loginService.saveUser(user)
            setTimeout(() => {
                this.loading = false;
                this.toast.success('Connexion réussie');
                this.router.navigate(['/saisie']);
            }, 900)

            ;})
            .catch((err) => {
                this.loading = false;
                this.toast.error('Email ou Mot de passe Incorrect');
            })

    }
}