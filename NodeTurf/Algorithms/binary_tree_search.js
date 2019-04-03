/* 
- each parent can have only two children i,e left and the right;
- children can have only one parent;
*/

function Node(data) {
    this.data = data;
    this.left = null;
    this.right = null;
}

function Tree() {
    this.root = null;
}

Tree.prototype = {
    insert: function (value) {

        // create a node for this new value;
        let newNode = new Node(value);

        if (this.root === null) {
            this.root = newNode;
        } else {
            this.insertNode(this.root, newNode);
        }

    },
    insertNode: function (currentNode, newNode) {

        //Decide if to add on left leg or right leg;
        if (newNode.data < currentNode.data) {
            if (currentNode.left === null) {
                currentNode.left = newNode;
            } else {
                this.insertNode(currentNode.left, newNode);
            }
        } else {
            if (currentNode.right === null) {
                currentNode.right = newNode;
            } else {
                this.insertNode(currentNode.right, newNode);
            }
        }

    },
    search: function (node, data) {

        if (node === null) {
            return null;
        }

        if (data < node.data) {
            return this.search(node.left, data);
        } else if (data > node.data) {
            return this.search(node.right, data)
        } else {
            return node;
        }

    },
    getRoot: function () {
        return this.root;
    },
    findMinNode: function (node) {
        if (node.left === null) {
            return node;
        }
        return this.findMinNode(node.left);
    },
    findMaxNode: function (node) {

        if (node.right === null) {
            return node;
        }

        return this.findMaxNode(node.right)

    },
    inOrder: function (node) {
        if (node !== null) {
            this.inOrder(node.left);
            console.log("Inorder ", node.data);
            this.inOrder(node.right);
        }
    },
    preOrder: function (node) {
        if (node) {
            console.log("PRE ORDER", node.data);
            this.preOrder(node.left);
            this.preOrder(node.right);
        }
    },
    postOrder: function (node) {
        if (node !== null) {
            this.postOrder(node.left);
            this.postOrder(node.right);
            console.log("POST ORDER: " , node.data);
        }
    }

}


let tree = new Tree();

//let arr = [15,25,10,7,22,17,13,5,9,27]

//INSERT NODES;
tree.insert(15);
tree.insert(25);
tree.insert(10);
tree.insert(7);
tree.insert(22);
tree.insert(17);
tree.insert(13);
tree.insert(5);
tree.insert(9);
tree.insert(27);

let root = tree.getRoot();
console.log("ROOT ", root);

var searchResult = tree.search(tree.getRoot(), 27);
console.log("\nFOUND ", searchResult);


console.log("\nMin Node : ", tree.findMinNode(root));


console.log("\nMAX NODE : ", tree.findMaxNode(root));


tree.inOrder(root);


tree.preOrder(root);


tree.postOrder(root);
