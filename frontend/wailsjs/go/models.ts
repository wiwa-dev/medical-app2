export namespace models {
	
	export class MonthSummary {
	    Month: number;
	    PreviousBalance: number;
	    TotalReceipts: number;
	    TotalHonoraires: number;
	    OtherExpenses: number;
	    TotalInvestments: number;
	    Profit: number;
	    ClosingBalance: number;
	
	    static createFrom(source: any = {}) {
	        return new MonthSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Month = source["Month"];
	        this.PreviousBalance = source["PreviousBalance"];
	        this.TotalReceipts = source["TotalReceipts"];
	        this.TotalHonoraires = source["TotalHonoraires"];
	        this.OtherExpenses = source["OtherExpenses"];
	        this.TotalInvestments = source["TotalInvestments"];
	        this.Profit = source["Profit"];
	        this.ClosingBalance = source["ClosingBalance"];
	    }
	}
	export class AnnualReport {
	    Year: number;
	    InitialBalance: number;
	    Months: MonthSummary[];
	    TotalReceipts: number;
	    TotalHonoraires: number;
	    TotalOtherExp: number;
	    TotalInvestments: number;
	    TotalProfit: number;
	    ClosingBalance: number;
	
	    static createFrom(source: any = {}) {
	        return new AnnualReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Year = source["Year"];
	        this.InitialBalance = source["InitialBalance"];
	        this.Months = this.convertValues(source["Months"], MonthSummary);
	        this.TotalReceipts = source["TotalReceipts"];
	        this.TotalHonoraires = source["TotalHonoraires"];
	        this.TotalOtherExp = source["TotalOtherExp"];
	        this.TotalInvestments = source["TotalInvestments"];
	        this.TotalProfit = source["TotalProfit"];
	        this.ClosingBalance = source["ClosingBalance"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DailyEntry {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Date: string;
	    Analyses: number;
	    GSRH: number;
	    ECG: number;
	    Ecocoeur: number;
	    HolterECG: number;
	    MAPA: number;
	    Dentiste: number;
	    Ophtalmologie: number;
	    Imagerie: number;
	    Cardiologie: number;
	    Status: string;
	
	    static createFrom(source: any = {}) {
	        return new DailyEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Date = source["Date"];
	        this.Analyses = source["Analyses"];
	        this.GSRH = source["GSRH"];
	        this.ECG = source["ECG"];
	        this.Ecocoeur = source["Ecocoeur"];
	        this.HolterECG = source["HolterECG"];
	        this.MAPA = source["MAPA"];
	        this.Dentiste = source["Dentiste"];
	        this.Ophtalmologie = source["Ophtalmologie"];
	        this.Imagerie = source["Imagerie"];
	        this.Cardiologie = source["Cardiologie"];
	        this.Status = source["Status"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DailyExpense {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Date: string;
	    Description: string;
	    Amount: number;
	
	    static createFrom(source: any = {}) {
	        return new DailyExpense(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Date = source["Date"];
	        this.Description = source["Description"];
	        this.Amount = source["Amount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DailyEntryWithExpenses {
	    Entry: DailyEntry;
	    Expenses: DailyExpense[];
	
	    static createFrom(source: any = {}) {
	        return new DailyEntryWithExpenses(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Entry = this.convertValues(source["Entry"], DailyEntry);
	        this.Expenses = this.convertValues(source["Expenses"], DailyExpense);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class DayHistoryRow {
	    Date: string;
	    TotalReceipts: number;
	    TotalExpenses: number;
	    NetBalance: number;
	    Status: string;
	
	    static createFrom(source: any = {}) {
	        return new DayHistoryRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Date = source["Date"];
	        this.TotalReceipts = source["TotalReceipts"];
	        this.TotalExpenses = source["TotalExpenses"];
	        this.NetBalance = source["NetBalance"];
	        this.Status = source["Status"];
	    }
	}
	export class Investment {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Month: number;
	    Year: number;
	    Description: string;
	    Amount: number;
	
	    static createFrom(source: any = {}) {
	        return new Investment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Month = source["Month"];
	        this.Year = source["Year"];
	        this.Description = source["Description"];
	        this.Amount = source["Amount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class MonthlyHonoraire {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Month: number;
	    Year: number;
	    PersonName: string;
	    Role: string;
	    Amount: number;
	
	    static createFrom(source: any = {}) {
	        return new MonthlyHonoraire(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Month = source["Month"];
	        this.Year = source["Year"];
	        this.PersonName = source["PersonName"];
	        this.Role = source["Role"];
	        this.Amount = source["Amount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ServiceWeekData {
	    Service: string;
	    Weeks: number[];
	    Total: number;
	
	    static createFrom(source: any = {}) {
	        return new ServiceWeekData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Service = source["Service"];
	        this.Weeks = source["Weeks"];
	        this.Total = source["Total"];
	    }
	}
	export class MonthlyReport {
	    Month: number;
	    Year: number;
	    WeekCount: number;
	    Services: ServiceWeekData[];
	    WeekTotals: number[];
	    TotalReceipts: number;
	    Honoraires: MonthlyHonoraire[];
	    TotalHonoraires: number;
	    OtherExpensesTotal: number;
	    Investments: Investment[];
	    TotalInvestments: number;
	    TotalExpenses: number;
	    PreviousBalance: number;
	    Profit: number;
	    FinalBalance: number;
	
	    static createFrom(source: any = {}) {
	        return new MonthlyReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Month = source["Month"];
	        this.Year = source["Year"];
	        this.WeekCount = source["WeekCount"];
	        this.Services = this.convertValues(source["Services"], ServiceWeekData);
	        this.WeekTotals = source["WeekTotals"];
	        this.TotalReceipts = source["TotalReceipts"];
	        this.Honoraires = this.convertValues(source["Honoraires"], MonthlyHonoraire);
	        this.TotalHonoraires = source["TotalHonoraires"];
	        this.OtherExpensesTotal = source["OtherExpensesTotal"];
	        this.Investments = this.convertValues(source["Investments"], Investment);
	        this.TotalInvestments = source["TotalInvestments"];
	        this.TotalExpenses = source["TotalExpenses"];
	        this.PreviousBalance = source["PreviousBalance"];
	        this.Profit = source["Profit"];
	        this.FinalBalance = source["FinalBalance"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class User {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    FirstName: string;
	    LastName: string;
	    Email: string;
	    Password: string;
	    Isadmin: boolean;
	
	    static createFrom(source: any = {}) {
	        return new User(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.FirstName = source["FirstName"];
	        this.LastName = source["LastName"];
	        this.Email = source["Email"];
	        this.Password = source["Password"];
	        this.Isadmin = source["Isadmin"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class YearSettings {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    // Go type: gorm
	    DeletedAt: any;
	    Year: number;
	    InitialBalance: number;
	
	    static createFrom(source: any = {}) {
	        return new YearSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.DeletedAt = this.convertValues(source["DeletedAt"], null);
	        this.Year = source["Year"];
	        this.InitialBalance = source["InitialBalance"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

