import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'age'
})
export class AgePipe implements PipeTransform {

  transform(dateOfBirth: string): number | null{
    if (!dateOfBirth) return null;

    const [dd, mm, yyyy] = dateOfBirth.split('/').map(Number);
    if (!dd || !mm || !yyyy) return null;

    const today = new Date();
    let age = today.getFullYear() - yyyy;

    const birthdayPassed =
      today.getMonth() + 1 > mm ||
      (today.getMonth() + 1 === mm && today.getDate() >= dd);

    if (!birthdayPassed) age--;

    return age;
  }

}
