pipeline {
    agent any

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['aws', 'local'], description: 'Target Kubernetes environment (aws uses k8s/08-backend-hpa-aws.yaml maxReplicas=3, local uses k8s/backend-hpa.yaml maxReplicas=8)')
    }

    environment {
        // Production GHCR container registry namespace
        REGISTRY                 = 'ghcr.io/adarsh-kumar6534'
        BACKEND_IMAGE            = "${REGISTRY}/reliefgrid-backend"
        FRONTEND_IMAGE           = "${REGISTRY}/reliefgrid-frontend"
        
        // Jenkins credential IDs for secure authentication (NO hardcoded secrets in source code)
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
                echo "  RELIEFGRID CI/CD PIPELINE — STAGE 6 (WINDOWS AGENT)"
                echo "=================================================="
                echo "Target Environment: ${params.DEPLOY_ENV ?: 'aws'}"
                echo "Building Commit   : ${env.GIT_COMMIT}"
                echo "Build Number      : ${env.BUILD_NUMBER}"
                
                // Derive immutable commit-sha image tag
                script {
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(8)}"
                    echo "Derived Immutable Image Tag: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "[1/6] Installing Python and Node dependencies on Windows Agent..."
                bat 'python -m pip install --upgrade pip'
                bat 'pip install -r backend/requirements.txt'
                dir('frontend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Backend Unit Tests') {
            steps {
                echo "[2/6] Executing Backend pytest test suite..."
                // Fail fast if backend unit tests break
                bat 'cd backend && python -m pytest --tb=short'
            }
        }

        stage('Frontend Build Validation') {
            steps {
                echo "[3/6] Verifying Next.js TypeScript compilation and standalone build..."
                dir('frontend') {
                    bat 'npm run build'
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "[4/6] Building production Docker container images via Docker Desktop..."
                bat "docker build -t ${env.BACKEND_IMAGE}:${env.IMAGE_TAG} -t ${env.BACKEND_IMAGE}:latest ./backend"
                bat "docker build -t ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} -t ${env.FRONTEND_IMAGE}:latest ./frontend"
            }
        }

        stage('Push Images to Registry') {
            steps {
                echo "[5/6] Authenticating and pushing container images to GHCR..."
                // Use Jenkins Credentials binding to prevent secret leakage in console logs
                withCredentials([usernamePassword(credentialsId: env.REGISTRY_CREDENTIALS_ID, usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
                    bat 'echo %REG_PASS%| docker login ghcr.io -u %REG_USER% --password-stdin'
                    bat "docker push ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}"
                    bat "docker push ${env.BACKEND_IMAGE}:latest"
                    bat "docker push ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}"
                    bat "docker push ${env.FRONTEND_IMAGE}:latest"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "[6/6] Applying base Kubernetes manifests and updating deployment image tags..."
                // Bind Kubeconfig secret file credential to prevent local context accidental fallback
                withCredentials([file(credentialsId: env.KUBE_CREDENTIALS_ID, variable: 'KUBECONFIG_FILE')]) {
                    script {
                        def targetEnv = params.DEPLOY_ENV ?: 'aws'
                        def hpaManifest = (targetEnv == 'aws') ? 'k8s/08-backend-hpa-aws.yaml' : 'k8s/backend-hpa.yaml'

                        echo "Deploying to Kubernetes (${targetEnv}) using injected Kubeconfig: ${KUBECONFIG_FILE}"

                        // Step 1: Apply base namespace, configs, databases, deployments, and ingress FIRST
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" apply -f k8s/00-namespace.yaml"
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" apply -f k8s/01-configmap.yaml"
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" apply -f k8s/03-postgres.yaml"
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" apply -f k8s/04-redis.yaml"
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" apply -f k8s/05-backend.yaml"
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" apply -f k8s/06-frontend.yaml"
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" apply -f k8s/07-ingress.yaml"

                        // Step 2: Apply capacity-aware HPA manifest (AWS maxReplicas=3 vs Local maxReplicas=8)
                        echo "Applying HPA profile: ${hpaManifest}..."
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" apply -f ${hpaManifest}"

                        // Step 3: Set deployment container images to immutable build tag LAST to avoid manifest overwrite
                        echo "Updating backend deployment image to ${env.BACKEND_IMAGE}:${env.IMAGE_TAG}..."
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" set image deployment/backend backend=${env.BACKEND_IMAGE}:${env.IMAGE_TAG} -n reliefgrid"

                        echo "Updating frontend deployment image to ${env.FRONTEND_IMAGE}:${env.IMAGE_TAG}..."
                        bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" set image deployment/frontend frontend=${env.FRONTEND_IMAGE}:${env.IMAGE_TAG} -n reliefgrid"
                    }
                }
            }
        }

        stage('Verify Rollout Status') {
            steps {
                echo "Verifying zero-downtime rollout completion and cluster pod status..."
                withCredentials([file(credentialsId: env.KUBE_CREDENTIALS_ID, variable: 'KUBECONFIG_FILE')]) {
                    bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" rollout status deployment/backend -n reliefgrid --timeout=120s"
                    bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" rollout status deployment/frontend -n reliefgrid --timeout=120s"
                    bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" get pods -n reliefgrid"
                    bat "kubectl --kubeconfig=\"%KUBECONFIG_FILE%\" get hpa -n reliefgrid"
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning temporary Docker build layers..."
            bat 'docker image prune -f --filter "until=24h"'
        }
        success {
            echo "SUCCESS: ReliefGrid CI/CD Pipeline completed successfully for tag ${env.IMAGE_TAG}!"
        }
        failure {
            echo "FAILURE: ReliefGrid Pipeline failed. Deployment aborted."
        }
    }
}
