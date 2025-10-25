#ifndef PRIORITY_QUEUE_H
#define PRIORITY_QUEUE_H

#include <vector>
#include <queue>
#include <cmath>
#include <set>
#include <algorithm>
#include <iostream>
#include <functional>
#include <utility>

template<typename T>
class PriorityQueue {
private:
    std::vector<T> elements;
    using Compare = std::function<bool(const T&, const T&)>;
    Compare compareFn;

    struct HeapComparator {
        Compare compareFn;

        bool operator()(const T& lhs, const T& rhs) const {
            // Flip operands so compareFn's "smaller" element rises to the top.
            return compareFn(rhs, lhs);
        }
    };

    HeapComparator heapComparator() const {
        return HeapComparator{ compareFn };
    }

public:
    PriorityQueue(std::vector<T> elements, Compare compareFn)
        : elements(std::move(elements)), compareFn(std::move(compareFn)) {
        std::make_heap(this->elements.begin(), this->elements.end(), heapComparator());
    }

    void push(const T& element) {
        elements.push_back(element);
        std::push_heap(elements.begin(), elements.end(), heapComparator());
    }

    void push(T&& element) {
        elements.push_back(std::move(element));
        std::push_heap(elements.begin(), elements.end(), heapComparator());
    }

    T pop() {
        std::pop_heap(elements.begin(), elements.end(), heapComparator());
        T element = std::move(elements.back());
        elements.pop_back();
        return element;
    }

    bool isEmpty() const {
        return elements.empty();
    }
};

#endif //PRIORITY_QUEUE_H
