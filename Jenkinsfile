pipeline {
  agent any

  triggers { githubPush() }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build') {
      steps {
        bat 'docker compose build'
      }
    }

    stage('Deploy') {
      steps {
        bat 'docker compose up -d --build'
      }
    }

    stage('Smoke Test') {
      steps {
        bat 'timeout /t 5 /nobreak'
        bat 'curl -f http://localhost:3000/api/health'
      }
    }
  }

  post {
    always {
      bat 'docker ps'
    }
  }
}
