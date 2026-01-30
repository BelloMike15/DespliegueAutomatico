pipeline {
  agent any

  // Trigger automático cuando se hace push a GitHub
  // Pipeline3 - despliegue automático
  // Victor Delgado Meza
  //EN CLASES PRUEBA----
  //Mike  Bello Alonzo prueba 2
  //hola como estas
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

    stage('Show Changes') {
      steps {
        sh '''
          echo "=========================================="
          echo "         INFORMACIÓN DEL COMMIT          "
          echo "=========================================="
          echo ""
          echo "Último commit:"
          git log -1 --pretty=format:"Autor: %an%nFecha: %ad%nMensaje: %s" --date=local
          echo ""
          echo ""
          echo "=========================================="
          echo "         ARCHIVOS MODIFICADOS            "
          echo "=========================================="
          git diff-tree --no-commit-id --name-status -r HEAD
          echo ""
          echo "=========================================="
          echo "         DETALLE DE LOS CAMBIOS          "
          echo "=========================================="
          git show --stat HEAD
        '''
      }
    }

    stage('Cleanup Old Containers') {
      steps {
        sh '''
          # Detener y eliminar TODOS los contenedores que usan puertos 3000 y 8080
          docker ps -q --filter "publish=3000" | xargs -r docker rm -f || true
          docker ps -q --filter "publish=8080" | xargs -r docker rm -f || true

          # Limpiar todos los proyectos tiendamiketech (cualquier variante)
          docker ps -a --filter "name=tiendamiketech" -q | xargs -r docker rm -f || true

          # Limpiar compose actual
          docker compose down --remove-orphans || true

          # Esperar un momento para que los puertos se liberen
          sleep 2
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
        curl -f http://localhost:3000/frontend/index.html
    '''
  }
}
//mike

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
