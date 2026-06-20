import {Injectable} from "@angular/core";
import {CreateUser, UpdateAdminProfile, UpdatePassword} from "../../../../wailsjs/go/main/App";
import {models} from "../../../../wailsjs/go/models";
import User = models.User;


@Injectable({
    providedIn: 'root'
})

export class UserService {


    CreateUser(user: User) {
        return CreateUser(user)
    }

    UpdateAdminProfile(user: User) {
        return UpdateAdminProfile(user)
    }
    //
    UpdateAdminPassword(user: User, newPassword: string) {
        return UpdatePassword(user.ID, newPassword)
    }
}