pipeline {
  agent any

  // Trigger automático cuando se hace push a GitHub
  // Test webhook - trigger automático
  //prueba dos - trigger automático
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

    stage('Cleanup Old Containers') {
      steps {
        sh '''
          # Detener contenedores que usan el puerto 3000 o 8080
          docker ps -q --filter "publish=3000" | xargs -r docker stop || true
          docker ps -q --filter "publish=8080" | xargs -r docker stop || true

          # Eliminar contenedores viejos del proyecto
          docker compose down --remove-orphans || true
          docker ps -a --filter "name=tiendamiketech" -q | xargs -r docker rm -f || true
        '''
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
