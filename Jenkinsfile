pipeline {
    agent any

    tools {
        nodejs "Node20"
        dockerTool "Dockertool"
    }

    stages {

        stage('Checkout') {
            steps {
                // Limpia el workspace para evitar errores tipo "fatal: not in a git directory"
                deleteDir()
                // Clona el repositorio configurado en "Pipeline script from SCM"
                checkout scm
            }
        }

        stage('Instalar dependencias') {
            steps {
                sh 'npm install'
            }
        }

        stage('Ejecutar tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Construir Imagen Docker') {
            steps {
                sh 'docker build -t hola-mundo-node:latest .'
            }
        }

        stage('Ejecutar Contenedor Node.js') {
            steps {
                sh '''
                    docker rm -f hola-mundo-node 2>/dev/null || true
                    docker run -d --name hola-mundo-node -p 3000:3000 hola-mundo-node:latest
                    docker ps --filter "name=hola-mundo-node"
                '''
            }
        }
    }

    post {
        always {
            echo "Build finalizado con resultado: ${currentBuild.currentResult}"
        }
        failure {
            echo "Falló el pipeline. Revisa tests, checkout o Docker."
        }
    }
}
