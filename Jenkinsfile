pipeline {
  agent any

  stages {

    stage('Checkout') {
      steps {
        deleteDir()
        checkout scm
      }
    }

    stage('Check Docker & Compose') {
      steps {
        sh '''
          docker --version
          docker compose version
        '''
      }
    }

    stage('Build (Compose)') {
      steps {
        sh 'docker compose build'
      }
    }

    stage('Deploy (Compose Up)') {
      steps {
        sh 'docker compose up -d --build'
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          sleep 5
          curl -f http://localhost:3000/api/health
        '''
      }
    }

  }

  post {
    always {
      echo "Build finalizado con resultado: ${currentBuild.currentResult}"
      sh 'docker ps'
    }
    failure {
      echo "Falló el pipeline. Revisa Docker/Compose o el health endpoint."
    }
  }
}
