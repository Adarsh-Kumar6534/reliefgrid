pipeline {
    agent any

    environment {
        // Configurable container registry namespace
        REGISTRY                 = 'ghcr.io/yourusername'
        BACKEND_IMAGE            = "${REGISTRY}/reliefgrid-backend"
        FRONTEND_IMAGE           = "${REGISTRY}/reliefgrid-frontend"
        
        // Jenkins credentials IDs for secure authentication (NO hardcoded secrets in source code)
        REGISTRY_CREDENTIALS_ID  = 'docker-registry-credentials'
        KUBE_CREDENTIALS_ID      = 'k3s-kubeconfig'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout & Environment Info') {
            steps {
                echo "=================================================="
                echo "  RELIEFGRID CI/CD PIPELINE — STAGE 6"
                echo "=================================================="
                echo "Building Commit : ${GIT_COMMIT}"
                echo "Build Number    : ${BUILD_NUMBER}"
                
                // Derive immutable commit-sha image tag
                script {
                    env.IMAGE_TAG = "${BUILD_NUMBER}-${GIT_COMMIT.take(8)}"
                    echo "Derived Image Tag: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "[1/6] Installing Python and Node dependencies..."
                sh 'python -m pip install --upgrade pip'
                sh 'pip install -r backend/requirements.txt'
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Backend Unit Tests') {
            steps {
                echo "[2/6] Executing Backend pytest test suite..."
                // Fail fast if unit tests break
                sh 'cd backend && pytest --tb=short'
            }
        }

        stage('Frontend Build Validation') {
            steps {
                echo "[3/6] Verifying Next.js TypeScript compilation and standalone build..."
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "[4/6] Building production Docker container images using Stage 3 Dockerfiles..."
                sh "docker build -t ${env.BACKEND_IMAGE}:${env.IMAGE_TAG} -t ${env.BACKEND_IMAGE}:latest ./backend"
                sh "docker build -t ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} -t ${env.FRONTEND_IMAGE}:latest ./frontend"
            }
        }

        stage('Push Images to Registry') {
            steps {
                echo "[5/6] Authenticating and pushing container images to registry..."
                // Use Jenkins Credentials binding to prevent secret leakage in console logs
                withCredentials([usernamePassword(credentialsId: env.REGISTRY_CREDENTIALS_ID, usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    sh 'echo "$REG_PASS" | docker login -u "$REG_USER" --password-stdin'
                    sh "docker push ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}"
                    sh "docker push ${env.BACKEND_IMAGE}:latest"
                    sh "docker push ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}"
                    sh "docker push ${env.FRONTEND_IMAGE}:latest"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "[6/6] Updating Kubernetes deployments in 'reliefgrid' namespace..."
                script {
                    // Update deployment container images with immutable build tags
                    sh "kubectl set image deployment/backend backend=${env.BACKEND_IMAGE}:${env.IMAGE_TAG} -n reliefgrid"
                    sh "kubectl set image deployment/frontend frontend=${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} -n reliefgrid"
                    
                    // Apply updated Kubernetes manifests
                    sh 'kubectl apply -f k8s/00-namespace.yaml'
                    sh 'kubectl apply -f k8s/01-configmap.yaml'
                    sh 'kubectl apply -f k8s/03-postgres.yaml'
                    sh 'kubectl apply -f k8s/04-redis.yaml'
                    sh 'kubectl apply -f k8s/05-backend.yaml'
                    sh 'kubectl apply -f k8s/06-frontend.yaml'
                    sh 'kubectl apply -f k8s/07-ingress.yaml'
                    sh 'kubectl apply -f k8s/backend-hpa.yaml'
                }
            }
        }

        stage('Verify Rollout Status') {
            steps {
                echo "Verifying zero-downtime rollout completion..."
                sh 'kubectl rollout status deployment/backend -n reliefgrid --timeout=120s'
                sh 'kubectl rollout status deployment/frontend -n reliefgrid --timeout=120s'
            }
        }
    }

    post {
        always {
            echo "Cleaning temporary Docker build layers..."
            sh 'docker image prune -f --filter "until=24h"'
        }
        success {
            echo "SUCCESS: ReliefGrid CI/CD Pipeline completed successfully for tag ${env.IMAGE_TAG}!"
        }
        failure {
            echo "FAILURE: ReliefGrid Pipeline failed. Deployment aborted."
        }
    }
}
