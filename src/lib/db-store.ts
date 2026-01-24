export type UserRole = "ADMIN" | "STUDENT" | "EMPLOYEE" | "CLIENT";
export type UserStatus = "PENDING" | "ACTIVE" | "BLOCKED";

export interface User {
    id: string;
    name: string;
    mobile: string;
    email?: string; // Made optional for backward compatibility or strict if desired, let's make it string | undefined for now or string
    role: UserRole;
    password?: string;
    status: UserStatus;
    createdAt: Date;
}

// Global scope hack to preserve data during hot-reloads (dev mode)
const globalForStore = global as unknown as {
    store: User[],
    invoices: Invoice[]
};

class DBStore {
    private users: User[];
    private invoices: Invoice[];

    constructor() {
        this.users = globalForStore.store || [];
        this.invoices = globalForStore.invoices || [];

        if (!globalForStore.store) {
            // Seed Admin
            this.users.push({
                id: "admin-id",
                name: "System Administrator",
                mobile: "admin",
                email: "admin@tejaskpaisoftware.com",
                role: "ADMIN",
                password: "admin123",
                status: "ACTIVE",
                createdAt: new Date(),
            });
            globalForStore.store = this.users;
        }

        if (!globalForStore.invoices) {
            globalForStore.invoices = this.invoices;
        }
    }

    addUser(user: Omit<User, "id" | "createdAt" | "status">) {
        const newUser: User = {
            ...user,
            id: Math.random().toString(36).substr(2, 9),
            status: "PENDING", // Default to PENDING for approval workflow
            createdAt: new Date(),
        };
        this.users.push(newUser);
        return newUser;
    }

    findUser(mobile: string) {
        return this.users.find((u) => u.mobile === mobile);
    }

    getAllUsers() {
        return this.users;
    }

    updatePassword(mobile: string, password: string) {
        const user = this.findUser(mobile);
        if (user) {
            user.password = password;
            return true;
        }
        return false;
    }

    updateStatus(mobile: string, status: UserStatus) {
        const user = this.findUser(mobile);
        if (user) {
            user.status = status;
            return true;
        }
        return false;
    }

    updateUser(mobile: string, data: Partial<Omit<User, "id" | "createdAt" | "status" | "password">>) {
        const user = this.findUser(mobile);
        if (user) {
            if (data.name) user.name = data.name;
            if (data.role) user.role = data.role;
            if (data.email) user.email = data.email;

            // Mobile update is tricky but allowed if unique
            if (data.mobile && data.mobile !== mobile) {
                if (this.findUser(data.mobile)) return false;
                user.mobile = data.mobile;
            }
            return true;
        }
        return false;
    }

    deleteUser(mobile: string) {
        const index = this.users.findIndex((u) => u.mobile === mobile);
        if (index !== -1) {
            this.users.splice(index, 1);
            return true;
        }
        return false;
    }

    // INVOICE MODULE

    createInvoice(invoice: Omit<Invoice, "id" | "createdAt" | "invoiceNumber">) {
        const newInvoice: Invoice = {
            ...invoice,
            id: Math.random().toString(36).substr(2, 9),
            invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            createdAt: new Date(),
        };
        this.invoices.push(newInvoice);
        return newInvoice;
    }

    getInvoices(userId?: string) {
        if (userId) {
            return this.invoices.filter(inv => inv.userId === userId);
        }
        return this.invoices;
    }

    getInvoiceById(id: string) {
        return this.invoices.find(inv => inv.id === id);
    }

    updateInvoice(id: string, data: Partial<Pick<Invoice, "paidAmount">>) {
        const invoice = this.getInvoiceById(id);
        if (invoice) {
            if (data.paidAmount !== undefined) {
                invoice.paidAmount = data.paidAmount;
            }
            return true;
        }
        return false;
    }
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    userId: string; // Mobile number of the student
    customerName: string;
    type: "INTERNSHIP" | "TRAINING";
    items: {
        description: string; // Course Name
        duration: string;
        startDate?: string;
        endDate?: string;
        amount: number;
    }[];
    subtotal: number;
    discount?: number;
    sgst: number;
    cgst: number;
    total: number;
    paidAmount: number;
    dueDate: string;
    createdAt: Date;
    user?: User;
}

export const db = new DBStore();
