CLUSTER_NAME=template-local
NAMESPACE=payments
IMAGE=microservice-template:local
HELM_CHART=./infrastructure/helm/microservice-template
HELM_VALUES=./infrastructure/helm/microservice-template/values-local.yaml
SERVICE?=microservice-template

.PHONY: build test docker-build load deploy redeploy status logs teardown cluster-create cluster-delete

build:
	mvn clean package -DskipTests

test:
	mvn verify

docker-build:
	docker build -t $(IMAGE) .

load:
	kind load docker-image $(IMAGE) --name $(CLUSTER_NAME)

deploy:
	helm upgrade --install microservice-template $(HELM_CHART) \
		-f $(HELM_VALUES) \
		-n $(NAMESPACE) \
		--wait

redeploy: build docker-build load deploy

status:
	kubectl get pods -n $(NAMESPACE)
	kubectl get services -n $(NAMESPACE)
	kubectl get ingress -n $(NAMESPACE)

logs:
	kubectl logs -f deployment/$(SERVICE) -n $(NAMESPACE)

teardown:
	helm uninstall microservice-template -n $(NAMESPACE) || true

cluster-create:
	kind create cluster --config infrastructure/kind/cluster-config.yaml --name $(CLUSTER_NAME)

cluster-delete:
	kind delete cluster --name $(CLUSTER_NAME)
