pipeline {
  agent any

  // Trigger automático cuando se hace push a GitHub
  triggers {
    githubPush()
  }

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

    stage('Prepare env') {
      steps {
        sh '''
          mkdir -p api
          cat <<EOF > api/.env
PORT=3000
NODE_ENV=production
EOF
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
      docker exec tiendamiketech-pipeline3-api-1 \
        curl -f http://localhost:3000/api/health
    '''
  }
}


  }

  post {
    always {
      echo "Build finalizado con resultado: ${currentBuild.currentResult}"
      sh 'docker ps || true'
    }
    failure {
      echo "Falló el pipeline. Revisa Docker/Compose o el health endpoint."
    }
  }
}
