import {inject, Injectable} from "@angular/core";
import {models} from "../../../../wailsjs/go/models";
import User = models.User;
import {Login, Logout} from "../../../../wailsjs/go/main/App";
import {BehaviorSubject} from "rxjs";
import {Router} from "@angular/router";
import {ToastService} from "./toast.service";


@Injectable({
    providedIn: 'root'
})

export class LoginService{
    private router = inject(Router)
    private currentUserSubject = new BehaviorSubject<User|null>(null)
    public currentUser = this.currentUserSubject.asObservable();
    private toast = inject(ToastService)
    loginUser(username: string, password: string): Promise<User> {
        return Login(username, password)
    }


    saveUser(user: User){
        this.currentUserSubject.next(user)
    }



    logout(){
        Logout().then((res)=>{
                this.toast.info('Vous étes deconnecter');
                this.currentUserSubject.next(null)
                this.router.navigate(['/login'])
        })
            .catch((err)=>{
                this.toast.error('Erreur de deconnexion: '+err.message)
            })
    }
}