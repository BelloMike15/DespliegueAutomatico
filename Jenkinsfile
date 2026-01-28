pipeline {
  agent any

  triggers {
    githubPush()
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build') {
      steps {
        sh 'docker compose build'
      }
    }

    stage('Deploy (Up)') {
      steps {
        sh 'docker compose up -d --build'
      }
    }

    stage('Smoke Test') {
      steps {
        sh 'sleep 5'
        sh 'curl -f http://localhost:3000/api/health'
      }
    }
  }

  post {
    always {
      sh 'docker ps'
    }
  }
}
