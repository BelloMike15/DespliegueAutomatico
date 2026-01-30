pipeline {
  agent any

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
          # Detener y eliminar contenedores que usan puertos 3000 y 8080
          docker ps -q --filter "publish=3000" | xargs -r docker rm -f || true
          docker ps -q --filter "publish=8080" | xargs -r docker rm -f || true

          # Limpiar todos los contenedores que tengan tiendamiketech en el nombre
          docker ps -a --filter "name=tiendamiketech" -q | xargs -r docker rm -f || true

          # Bajar compose actual si existe
          docker compose down --remove-orphans || true

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
          echo "⏳ Esperando que WEB responda (http://localhost:8080/)..."
          for i in 1 2 3 4 5 6 7 8 9 10; do
            if curl -fsS http://localhost:8080/ > /dev/null; then
              echo "✅ WEB OK"
              break
            fi
            echo "⏳ WEB aún no responde... intento $i/10"
            sleep 2
          done

          # Validación final web (si aún no responde, falla aquí)
          curl -fsS http://localhost:8080/ > /dev/null

          echo "⏳ Probando API (http://localhost:3000/api/health)..."
          curl -fsS http://localhost:3000/api/health > /dev/null
          echo "✅ API OK"

          echo "=============================================="
          echo "✅ OK: Despliegue correcto"
          echo "🌐 TIENDA (index.html): http://localhost:8080/"
          echo "🔧 API Health:          http://localhost:3000/api/health"
          echo "=============================================="
        '''
      }
    }
  }

  post {
    always {
      echo "Build finalizado con resultado: ${currentBuild.currentResult}"
      sh 'docker ps || true'
    }
    success {
      echo "✅ BUILD SUCCESS"
      echo "🌐 Abre tu tienda aquí: http://localhost:8080/"
    }
    failure {
      echo "❌ Falló el pipeline. Revisa Docker/Compose o los endpoints."
    }
  }
}
