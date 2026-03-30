const i18n = {
    en: {
        field: {
            cancel: "Cancel",
            execute: "Execute Task"
        },
        app: {
            title: "TMS Pulse",
            titlesubone: "TMS",
            titlesubtwo: "PULSE"
        },
        loader: {
            description: "Initializing Workspace"
        },
        dashboard: {
            title:  "Dashboard",
            subtitle: "Streamlined Server Setup, Maintenance, and Operational Workflows",
            quickaccess: "Quick Access Directory"
        },
        nav: {
            dashboard: "Dashboard",
            validation: "Server Validation",
            installation: "Server Installation",
            settings: "Settings"
        },
        dialog: {
            action: "Confirm Action",
            description: "Task description goes here."
        },
        sidebar: {
            dashboard: "Dashboard",
            servervalidation: "Server Validation",
            serverinstall: "Server Installation",
            settings: "Settings",
        },
        install: {
            title: "Server Installation",
            subtitle: "Deploy applications and configure environment structures",
            sections: {
                infra: "Infrastructure & Environment",
                db: "Database Configuration",
                db2: "Database-related Tasks"
            },
            btns: {
                init: { title: "Initialize Directory Tree", desc: "Builds D:\\tms-dos and subfolders" },
                env: { title: "Setup ENV (WIN)", desc: "Configures Windows environment variables" },
                createDb: { title: "Create DBs", desc: "Generates databases from .env" },
                createUser: { title: "Create DB User", desc: "Generates credentials from .env" },
                createdb: "Create DBs",
                exportdb: "Export DBs",
                importdb: "Import DBs",
                createdbuser: "Create DB User",
            }
        },
        validation: {
            title: "Server Validation",
            subtitle: "Live system resources and dependencies",
            refresh: "Refresh",
            quickAccess: "System Quick Access",
            btns: {
                ipconfig: "IPConfig",
                dxdiag: "DXDiag",
                driveD: "Drive D:",
                thisPc: "This PC",
                aboutPc: "About PC",
                taskMngr: "Task Manager"
            },
            hw: "Hardware & OS",
            hostname: "Hostname",
            ipv4: "IPv4",
            ram: "RAM",
            processor: "Processor",
            storage: "Storage",
            os: "OS Version",
            envChecks: "Environment Checks",
            whitelist: "Network Whitelist",
            network: {
                upload: "Upload",
                deploy: "Deploy",
                google: "Google",
                innovar: "Innovar",
                nextgen: "NextGen"
            },
            installations: "Installations",
            apps: {
                tmsDos: "TMS-DOS",
                mirth: "Mirth",
                bridgeLink: "BridgeLink",
                vsCode: "VS Code"
            }
        },
        settings: {
            title: "Application Settings",
            subtitle: "Configure TMS Pulse preferences and workspace behaviors",
            workspace: "Workspace Configuration",
            scriptDirTitle: "External Scripts Directory",
            scriptDirDesc: "The folder where TMS Pulse will look for your custom .bat files.",
            browseBtn: "Browse",
            checkingDir: "Checking directory...",
            resetBtn: "Reset to Default",
            driveConfig: "Drive Configuration",
            targetDriveTitle: "Target Application Drive",
            targetDriveDesc: "Select the drive letter to scan for installed dependencies (TMS-DOS, Mirth, etc.).",
            drives: {
                c: "Drive C:\\",
                d: "Drive D:\\",
                e: "Drive E:\\"
            },
            execPrefs: "Execution Preferences",
            autoCloseTitle: "Auto-Close Command Prompt",
            autoCloseDesc: "Automatically close the black terminal window when a task finishes.",
            appInfo: "Application Information",
            version: "Version",
            engine: "Electron Engine",
            developer: "Developer"
        },
        sections: {
            db2: "Database-related Tasks",
            systemhook: "System Hooking",
        },
        btns: {
            createdb: "Create DBs",
            exportdb: "Export DBs",
            importdb: "Import DBs",
            createdbuser: "Create DB User",
            setupwinenv: "Setup ENV (WIN)",
            registertool: "Register Tool",
        },
        desc: {
            openDir: "Opens the {dirName} directory",
            initdb: "Initialize new database schemas",
            exportdb: "Export current DB to SQL dumps",
            importsql: "Import SQL files into local DB",
            mcred: "Generates credentials from .env",
            winenv: "Configure Windows ENV variables",
            tlook: "Tool registration locked",
            sysIpconfig: "Runs ipconfig /all in terminal",
            sysDxdiag: "Opens DirectX Diagnostic Tool",
            sysAbout: "Opens Windows About PC settings",
            taskMngr: "Opens Windows Task Manager",
        },
        opentmsdos: "Open TMS-DOS",
        opencustomer: "Open Customers",
        opentmstool: "Open TMS-tools",
        
    }
};